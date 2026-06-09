<?php

namespace App\Models;

use App\Models\Concerns\HasRoles;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, HasUuids, HasRoles, Notifiable;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'organization_id',
        'approved_by_user_id',
        'school_id',
        'email',
        'password_hash',
        'first_name',
        'last_name',
        'phone',
        'address',
        'city',
        'state',
        'zip',
        'job_title',
        'profile_meta',
        'role',
        'is_active',
        'email_verified_at',
        'phone_verified_at',
        'last_login_at',
    ];

    protected $hidden = [
        'password_hash',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'phone_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'is_active' => 'boolean',
            'password_hash' => 'hashed',
            'profile_meta' => 'array',
        ];
    }

    /**
     * Tell Laravel auth to use the password_hash column.
     */
    public function getAuthPassword(): string
    {
        return $this->password_hash;
    }

    public function getFullNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->last_name}");
    }

    // --- JWTSubject ---

    public function getJWTIdentifier(): mixed
    {
        return $this->getKey();
    }

    /**
     * @return array<string, mixed>
     */
    public function getJWTCustomClaims(): array
    {
        return [
            'role' => $this->role,
            'organization_id' => $this->organization_id,
        ];
    }

    // --- Relationships ---

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function devices(): HasMany
    {
        return $this->hasMany(AppDevice::class);
    }

    public function parentAccount(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(ParentAccount::class);
    }
}
