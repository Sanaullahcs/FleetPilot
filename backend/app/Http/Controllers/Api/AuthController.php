<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppDevice;
use App\Models\Driver;
use App\Models\ParentAccount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $token = Auth::guard('api')->attempt($credentials);

        if (! $token) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        /** @var \App\Models\User $user */
        $user = Auth::guard('api')->user();

        if (! $user->is_active) {
            Auth::guard('api')->logout();

            throw ValidationException::withMessages([
                'email' => ['This account has been deactivated.'],
            ]);
        }

        $user->forceFill(['last_login_at' => now()])->save();

        return $this->respondWithToken($token, $user);
    }

    public function me(Request $request): JsonResponse
    {
        $user = Auth::guard('api')->user();

        return response()->json([
            'data' => $this->userPayload($user),
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = Auth::guard('api')->user();

        $rules = [
            'first_name' => ['sometimes', 'required', 'string', 'max:100'],
            'last_name' => ['sometimes', 'required', 'string', 'max:100'],
            'email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => ['nullable', 'string', 'max:20'],
            'address' => ['nullable', 'string', 'max:500'],
            'city' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:2'],
            'zip' => ['nullable', 'string', 'max:10'],
            'job_title' => ['nullable', 'string', 'max:100'],
            'password' => ['nullable', 'confirmed', Password::min(8)],
        ];

        $data = $request->validate($rules);

        if (isset($data['password'])) {
            $data['password_hash'] = $data['password'];
            unset($data['password']);
        }

        if (array_key_exists('password_confirmation', $data)) {
            unset($data['password_confirmation']);
        }

        if (! in_array($user->role, ['admin', 'dispatcher', 'school_contact', 'super_admin'], true)) {
            unset($data['job_title']);
        }

        $profileMeta = null;
        if ($user->role === 'contractor') {
            $profileMeta = $request->validate([
                'company_name' => ['sometimes', 'nullable', 'string', 'max:255'],
                'business_type' => ['sometimes', 'nullable', 'string', 'max:100'],
                'tax_id' => ['sometimes', 'nullable', 'string', 'max:50'],
                'fleet_size' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:100000'],
                'driver_count' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:100000'],
                'vehicle_count' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:100000'],
                'years_in_business' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:200'],
                'coverage_areas' => ['sometimes', 'nullable', 'string', 'max:2000'],
                'service_radius_miles' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:5000'],
                'insurance_carrier' => ['sometimes', 'nullable', 'string', 'max:150'],
                'insurance_policy_number' => ['sometimes', 'nullable', 'string', 'max:80'],
                'dot_number' => ['sometimes', 'nullable', 'string', 'max:50'],
                'mc_number' => ['sometimes', 'nullable', 'string', 'max:50'],
            ]);
        }

        DB::transaction(function () use ($user, $data, $profileMeta) {
            $user->update($data);

            if ($profileMeta !== null && $profileMeta !== []) {
                $meta = array_merge($user->profile_meta ?? [], $profileMeta);
                if (array_key_exists('company_name', $profileMeta)) {
                    $user->job_title = $profileMeta['company_name'] ?: $user->job_title;
                }
                $user->update([
                    'profile_meta' => $meta,
                    'job_title' => $user->job_title,
                ]);
            }

            if ($user->role === 'driver') {
                $driver = Driver::query()
                    ->where('organization_id', $user->organization_id)
                    ->where('user_id', $user->id)
                    ->first();

                if ($driver) {
                    $user->refresh();
                    $driver->update([
                        'first_name' => $user->first_name,
                        'last_name' => $user->last_name,
                        'email' => $user->email,
                        'phone' => $user->phone,
                        'address' => $this->formatAddressFromUser($user),
                    ]);
                }
            }
        });

        $user->refresh();

        return response()->json([
            'message' => 'Profile updated successfully.',
            'data' => $this->userPayload($user),
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function formatAddress(array $data): ?string
    {
        $parts = array_filter([
            $data['address'] ?? null,
            $data['city'] ?? null,
            isset($data['state'], $data['zip']) ? trim(($data['state'] ?? '').' '.($data['zip'] ?? '')) : null,
        ]);

        return $parts === [] ? null : implode(', ', $parts);
    }

    private function formatAddressFromUser(\App\Models\User $user): ?string
    {
        return $this->formatAddress([
            'address' => $user->address,
            'city' => $user->city,
            'state' => $user->state,
            'zip' => $user->zip,
        ]);
    }

    public function logout(): JsonResponse
    {
        Auth::guard('api')->logout();

        return response()->json(['message' => 'Successfully logged out.']);
    }

    public function refresh(): JsonResponse
    {
        $token = Auth::guard('api')->refresh();

        return $this->respondWithToken($token, Auth::guard('api')->user());
    }

    public function deleteAccount(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = Auth::guard('api')->user();

        if (! in_array($user->role, ['driver', 'parent'], true)) {
            abort(403, 'Account deletion is only available for driver and parent mobile accounts.');
        }

        $data = $request->validate([
            'password' => ['required', 'string'],
            'confirmation' => ['required', 'string', 'in:DELETE'],
        ]);

        if (! Hash::check($data['password'], $user->getAuthPassword())) {
            throw ValidationException::withMessages([
                'password' => ['The password you entered is incorrect.'],
            ]);
        }

        DB::transaction(function () use ($user) {
            AppDevice::where('user_id', $user->id)->delete();

            if ($user->role === 'driver') {
                Driver::where('user_id', $user->id)->update(['user_id' => null]);
            }

            if ($user->role === 'parent') {
                $account = ParentAccount::where('user_id', $user->id)->first();
                if ($account) {
                    $account->parentStudents()->delete();
                    $account->delete();
                }
            }

            $user->roles()->detach();

            $user->forceFill([
                'is_active' => false,
                'email' => 'deleted_'.$user->id.'@deleted.fleetpilot.local',
                'first_name' => 'Deleted',
                'last_name' => 'User',
                'phone' => null,
                'password_hash' => Hash::make(Str::random(64)),
            ])->save();
        });

        Auth::guard('api')->logout();

        return response()->json([
            'message' => 'Your account has been permanently deleted.',
        ]);
    }

    private function respondWithToken(string $token, $user): JsonResponse
    {
        return response()->json([
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => Auth::guard('api')->factory()->getTTL() * 60,
            'user' => $this->userPayload($user),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function userPayload($user): array
    {
        $user->loadMissing('roles.permissions', 'organization', 'school:id,name,code,city,state');

        return [
            'id' => $user->id,
            'email' => $user->email,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'full_name' => $user->full_name,
            'phone' => $user->phone,
            'address' => $user->address,
            'city' => $user->city,
            'state' => $user->state,
            'zip' => $user->zip,
            'job_title' => $user->job_title,
            'role' => $user->role,
            'school_id' => $user->school_id,
            'school' => $user->school ? [
                'id' => $user->school->id,
                'name' => $user->school->name,
                'code' => $user->school->code,
                'city' => $user->school->city,
                'state' => $user->school->state,
            ] : null,
            'organization' => $user->organization ? [
                'id' => $user->organization->id,
                'name' => $user->organization->name,
                'slug' => $user->organization->slug,
            ] : null,
            'profile_meta' => in_array($user->role, ['contractor', 'school_contact'], true)
                ? ($user->profile_meta ?? null)
                : null,
            'roles' => $user->roles->pluck('slug'),
            'permissions' => $user->allPermissions()->pluck('slug'),
        ];
    }
}
