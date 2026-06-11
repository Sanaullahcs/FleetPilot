<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Driver;
use App\Models\Organization;
use App\Models\ParentAccount;
use App\Models\RunAssignment;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class MobileController extends Controller
{
    public function appInfo(Request $request): JsonResponse
    {
        $org = $this->resolveOrganization($request);

        return response()->json([
            'data' => [
                'app' => [
                    'name' => 'FleetPilot Mobile',
                    'version' => '1.0.0',
                    'support_email' => $org?->email ?? 'support@fleetpilot.app',
                    'support_phone' => $org?->phone ?? '(555) 010-1000',
                    'support_hours' => 'Mon–Fri 6:00 AM – 6:00 PM local time',
                ],
                'organization' => $org ? [
                    'name' => $org->name,
                    'email' => $org->email,
                    'phone' => $org->phone,
                ] : null,
                'documents' => $this->legalDocuments($org?->name ?? 'your transportation provider'),
                'policies' => [
                    ['id' => 'privacy', 'title' => 'Privacy Policy', 'summary' => 'How we collect, use, and protect your data.'],
                    ['id' => 'terms', 'title' => 'Terms of Service', 'summary' => 'Rules for using the FleetPilot mobile app.'],
                    ['id' => 'account-deletion', 'title' => 'Account Deletion', 'summary' => 'How to delete your account and what data is removed.'],
                ],
            ],
        ]);
    }

    public function support(Request $request): JsonResponse
    {
        $user = $request->user();
        $org = $user->organization;

        return response()->json([
            'data' => [
                'channels' => [
                    [
                        'id' => 'dispatch',
                        'title' => 'Transportation dispatch',
                        'description' => 'Route changes, delays, and daily operations',
                        'email' => $org?->email ?? 'dispatch@metro-k12.example.com',
                        'phone' => $org?->phone ?? '(555) 010-1000',
                        'hours' => 'Mon–Fri 6:00 AM – 6:00 PM',
                    ],
                    [
                        'id' => 'technical',
                        'title' => 'App & account support',
                        'description' => 'Login issues, notifications, and account settings',
                        'email' => 'support@fleetpilot.app',
                        'phone' => null,
                        'hours' => 'Mon–Fri 8:00 AM – 5:00 PM ET',
                    ],
                    [
                        'id' => 'privacy',
                        'title' => 'Privacy & data requests',
                        'description' => 'Privacy questions and data access requests',
                        'email' => 'privacy@fleetpilot.app',
                        'phone' => null,
                        'hours' => 'Response within 5 business days',
                    ],
                ],
                'faqs' => [
                    [
                        'question' => 'How do I link my child to my parent account?',
                        'answer' => 'Contact your school transportation office. They can link students to your parent profile in the district system.',
                    ],
                    [
                        'question' => 'Why am I not seeing my runs?',
                        'answer' => 'Runs appear once dispatch assigns them for the day. Contact dispatch if you expected an assignment.',
                    ],
                    [
                        'question' => 'How do I delete my account?',
                        'answer' => 'Open Profile → Delete account. You will need your password. Deletion is permanent for app access.',
                    ],
                ],
            ],
        ]);
    }

    public function notifications(Request $request): JsonResponse
    {
        $user = $request->user();
        $items = [];

        if ($user->role === 'driver') {
            $items = array_merge($items, $this->driverNotifications($user));
        }

        if ($user->role === 'parent') {
            $items = array_merge($items, $this->parentNotifications($user));
        }

        $items = $this->applyReadState($user, $items);
        $unread = collect($items)->where('read', false)->count();

        if (! $request->boolean('include_read')) {
            $items = array_values(array_filter($items, fn (array $item) => ! $item['read']));
        }

        return response()->json([
            'data' => [
                'items' => $items,
                'total' => count($items),
                'unread' => $unread,
            ],
        ]);
    }

    public function markNotificationRead(Request $request, string $notificationId): JsonResponse
    {
        $user = $request->user();
        $meta = $user->profile_meta ?? [];
        $readIds = $meta['read_notification_ids'] ?? [];

        if (! in_array($notificationId, $readIds, true)) {
            $readIds[] = $notificationId;
        }

        $meta['read_notification_ids'] = array_values($readIds);
        $user->update(['profile_meta' => $meta]);

        return response()->json(['data' => ['id' => $notificationId, 'read' => true]]);
    }

    public function markAllNotificationsRead(Request $request): JsonResponse
    {
        $user = $request->user();
        $items = [];

        if ($user->role === 'driver') {
            $items = array_merge($items, $this->driverNotifications($user));
        }

        if ($user->role === 'parent') {
            $items = array_merge($items, $this->parentNotifications($user));
        }

        $ids = collect($items)->pluck('id')->all();
        $meta = $user->profile_meta ?? [];
        $meta['read_notification_ids'] = array_values(array_unique(array_merge($meta['read_notification_ids'] ?? [], $ids)));
        $user->update(['profile_meta' => $meta]);

        return response()->json(['data' => ['marked' => count($ids)]]);
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     * @return array<int, array<string, mixed>>
     */
    private function applyReadState($user, array $items): array
    {
        $readIds = $user->profile_meta['read_notification_ids'] ?? [];

        return array_map(function (array $item) use ($readIds) {
            $item['read'] = in_array($item['id'], $readIds, true) || ($item['read'] ?? false);

            return $item;
        }, $items);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function driverNotifications($user): array
    {
        $items = [];
        $driver = Driver::query()
            ->where('organization_id', $user->organization_id)
            ->where('user_id', $user->id)
            ->first();

        if (! $driver) {
            return $items;
        }

        $today = Carbon::today();
        $assignments = RunAssignment::query()
            ->where('driver_id', $driver->id)
            ->whereDate('service_date', $today)
            ->where('status', '!=', 'cancelled')
            ->with(['run:id,name,scheduled_start_time,direction'])
            ->get();

        if ($assignments->isEmpty()) {
            $items[] = [
                'id' => 'no_runs_today',
                'category' => 'schedule',
                'severity' => 'info',
                'title' => 'No runs scheduled today',
                'message' => 'Check back tomorrow or contact dispatch if you expected an assignment.',
                'time' => now()->toIso8601String(),
                'read' => false,
            ];
        } else {
            foreach ($assignments as $assignment) {
                $run = $assignment->run;
                $items[] = [
                    'id' => 'run_'.$assignment->id,
                    'category' => 'assignment',
                    'severity' => $assignment->status === 'in_progress' ? 'success' : 'info',
                    'title' => $run?->name ?? 'Assigned run',
                    'message' => sprintf(
                        '%s run · %s · Status: %s',
                        strtoupper($run?->direction ?? 'run'),
                        $run?->scheduled_start_time ?? 'TBD',
                        str_replace('_', ' ', $assignment->status),
                    ),
                    'time' => now()->toIso8601String(),
                    'read' => $assignment->status === 'completed',
                ];
            }
        }

        if ($driver->license_expiry && $driver->license_expiry->lte(Carbon::now()->addDays(30))) {
            $items[] = [
                'id' => 'license_expiry',
                'category' => 'compliance',
                'severity' => 'warning',
                'title' => 'License expiring soon',
                'message' => 'Your driver license expires on '.$driver->license_expiry->format('M j, Y').'.',
                'time' => now()->toIso8601String(),
                'read' => false,
            ];
        }

        if ($driver->medical_cert_expiry && $driver->medical_cert_expiry->lte(Carbon::now()->addDays(30))) {
            $items[] = [
                'id' => 'medical_expiry',
                'category' => 'compliance',
                'severity' => 'warning',
                'title' => 'Medical certificate expiring',
                'message' => 'Renew before '.$driver->medical_cert_expiry->format('M j, Y').'.',
                'time' => now()->toIso8601String(),
                'read' => false,
            ];
        }

        return $items;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function parentNotifications($user): array
    {
        $items = [];
        $account = ParentAccount::query()->where('user_id', $user->id)->first();

        if (! $account) {
            return [[
                'id' => 'link_children',
                'category' => 'account',
                'severity' => 'info',
                'title' => 'Link your children',
                'message' => 'Contact your school transportation office to connect student accounts.',
                'time' => now()->toIso8601String(),
                'read' => false,
            ]];
        }

        $students = Student::query()
            ->whereIn('id', function ($q) use ($account) {
                $q->select('student_id')
                    ->from('parent_students')
                    ->where('parent_account_id', $account->id);
            })
            ->with(['school:id,name'])
            ->get();

        if ($students->isEmpty()) {
            $items[] = [
                'id' => 'no_children',
                'category' => 'account',
                'severity' => 'info',
                'title' => 'No students linked yet',
                'message' => 'Your transportation office can link students to your account.',
                'time' => now()->toIso8601String(),
                'read' => false,
            ];
        }

        foreach ($students as $student) {
            $items[] = [
                'id' => 'student_'.$student->id,
                'category' => 'student',
                'severity' => 'info',
                'title' => trim("{$student->first_name} {$student->last_name}"),
                'message' => ($student->school?->name ?? 'School').' · Grade '.$student->grade,
                'time' => now()->toIso8601String(),
                'read' => false,
            ];
        }

        $items[] = [
            'id' => 'tracking_tip',
            'category' => 'tracking',
            'severity' => 'success',
            'title' => 'Live bus tracking available',
            'message' => 'Open the Track tab to see your child\'s bus location during active runs.',
            'time' => now()->toIso8601String(),
            'read' => false,
        ];

        return $items;
    }

    private function resolveOrganization(Request $request): ?Organization
    {
        $slug = $request->query('organization');

        if ($slug) {
            return Organization::where('slug', $slug)->first();
        }

        if ($request->user()?->organization_id) {
            return Organization::find($request->user()->organization_id);
        }

        return Organization::where('slug', 'metro-k12')->first();
    }

    /**
     * @return array<string, array{title: string, updated_at: string, sections: array<int, array{heading: string, body: string}>}>
     */
    private function legalDocuments(string $orgName): array
    {
        $updated = 'June 9, 2026';

        return [
            'privacy' => [
                'title' => 'Privacy Policy',
                'updated_at' => $updated,
                'sections' => [
                    [
                        'heading' => 'Overview',
                        'body' => "FleetPilot Mobile helps {$orgName} drivers and parents manage school transportation. This policy explains what data we collect and how it is used.",
                    ],
                    [
                        'heading' => 'Information we collect',
                        'body' => 'Account information (name, email, phone), device identifiers for push notifications, location data when drivers start a run or when parents view live bus tracking, and operational data such as run assignments and student ridership linked to your role.',
                    ],
                    [
                        'heading' => 'How we use information',
                        'body' => 'We use data to provide routing, live tracking, notifications, safety compliance, and communication between your district and app users. We do not sell personal information.',
                    ],
                    [
                        'heading' => 'Sharing',
                        'body' => 'Data is shared with your transportation organization, schools served by your district, and service providers that help us operate the platform (hosting, maps, push notifications) under contractual safeguards.',
                    ],
                    [
                        'heading' => 'Retention & security',
                        'body' => 'Operational records may be retained as required by district policy and law. We apply encryption in transit, access controls, and audit logging appropriate for student transportation systems.',
                    ],
                    [
                        'heading' => 'Your choices',
                        'body' => 'You may disable push notifications in device settings. Parents and drivers may request account deletion in the app. Contact privacy@fleetpilot.app for other privacy requests.',
                    ],
                ],
            ],
            'terms' => [
                'title' => 'Terms of Service',
                'updated_at' => $updated,
                'sections' => [
                    [
                        'heading' => 'Acceptance',
                        'body' => 'By using FleetPilot Mobile you agree to these terms and to follow your district transportation policies.',
                    ],
                    [
                        'heading' => 'Eligible users',
                        'body' => 'This app is intended for authorized drivers and parents/guardians invited by your transportation provider. You must keep login credentials confidential.',
                    ],
                    [
                        'heading' => 'Acceptable use',
                        'body' => 'Do not misuse location data, harass staff or families, attempt unauthorized access, or interfere with safety operations. District administrators may suspend access.',
                    ],
                    [
                        'heading' => 'Service availability',
                        'body' => 'Tracking and notifications depend on network connectivity, GPS hardware, and dispatch data. We strive for reliability but do not guarantee uninterrupted service.',
                    ],
                    [
                        'heading' => 'Limitation of liability',
                        'body' => 'FleetPilot is a tool to support transportation operations. Your district remains responsible for student safety and routing decisions.',
                    ],
                ],
            ],
            'account-deletion' => [
                'title' => 'Account Deletion Policy',
                'updated_at' => $updated,
                'sections' => [
                    [
                        'heading' => 'Who can delete',
                        'body' => 'Driver and parent mobile accounts may be deleted in-app from Profile → Delete account. Staff accounts must be deactivated by your district administrator.',
                    ],
                    [
                        'heading' => 'What is removed',
                        'body' => 'Your login credentials, push notification tokens, parent–student links (for parent accounts), and personal contact details associated with the app account are deleted or anonymized.',
                    ],
                    [
                        'heading' => 'What may be retained',
                        'body' => 'Your district may retain historical transportation records (run logs, attendance events, billing) as required for legal, safety, and audit purposes. Driver employment records remain with the district.',
                    ],
                    [
                        'heading' => 'How to delete',
                        'body' => 'Go to Profile → Delete account, enter your password, and confirm by typing DELETE. Deletion is immediate and cannot be undone from the app.',
                    ],
                    [
                        'heading' => 'Need help?',
                        'body' => 'Email support@fleetpilot.app or contact your transportation office if you cannot access your account.',
                    ],
                ],
            ],
        ];
    }
}
