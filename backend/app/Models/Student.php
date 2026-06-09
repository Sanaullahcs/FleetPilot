<?php

namespace App\Models;

use App\Models\Concerns\HasUuidAndOrg;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Student extends Model
{
    use HasUuidAndOrg;

    protected $fillable = [
        'organization_id', 'student_number', 'first_name', 'last_name', 'grade',
        'date_of_birth', 'school_id', 'assigned_driver_id', 'home_address', 'home_latitude',
        'home_longitude', 'has_iep', 'requires_wheelchair', 'requires_aide',
        'medical_notes', 'photo_url', 'status', 'emergency_contact_name',
        'emergency_contact_phone',
    ];

    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
            'home_latitude' => 'float',
            'home_longitude' => 'float',
            'has_iep' => 'boolean',
            'requires_wheelchair' => 'boolean',
            'requires_aide' => 'boolean',
        ];
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function assignedDriver(): BelongsTo
    {
        return $this->belongsTo(Driver::class, 'assigned_driver_id');
    }

    public function parentAccounts(): BelongsToMany
    {
        return $this->belongsToMany(ParentAccount::class, 'parent_students', 'student_id', 'parent_account_id')
            ->withPivot(['id', 'relationship', 'is_primary', 'can_pickup'])
            ->withTimestamps();
    }

    public function getFullNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->last_name}");
    }
}
