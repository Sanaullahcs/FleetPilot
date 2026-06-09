<?php

namespace App\Models;

use App\Models\Concerns\HasUuidAndOrg;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Driver extends Model
{
    use HasUuidAndOrg;

    protected $fillable = [
        'organization_id', 'user_id', 'contractor_id', 'default_vehicle_id', 'employee_id',
        'first_name', 'last_name', 'email', 'phone', 'license_number',
        'license_class', 'license_expiry', 'license_state', 'endorsements',
        'hire_date', 'status', 'date_of_birth', 'address',
        'emergency_contact_name', 'emergency_contact_phone',
        'medical_cert_expiry', 'background_check_date', 'drug_test_date', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'endorsements' => 'array',
            'license_expiry' => 'date',
            'hire_date' => 'date',
            'date_of_birth' => 'date',
            'medical_cert_expiry' => 'date',
            'background_check_date' => 'date',
            'drug_test_date' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function defaultVehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class, 'default_vehicle_id');
    }

    public function students(): HasMany
    {
        return $this->hasMany(Student::class, 'assigned_driver_id');
    }

    public function getFullNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->last_name}");
    }
}
