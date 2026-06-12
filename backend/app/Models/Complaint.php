<?php

namespace App\Models;

use App\Models\Concerns\HasUuidAndOrg;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Complaint extends Model
{
    use HasUuidAndOrg;

    protected $fillable = [
        'organization_id',
        'reference_number',
        'submitted_by_user_id',
        'submitter_role',
        'category',
        'subject',
        'description',
        'status',
        'priority',
        'preferred_contact',
        'contact_phone',
        'incident_date',
        'location_note',
        'student_id',
        'driver_id',
        'school_id',
        'route_id',
        'assigned_to_user_id',
        'resolution_summary',
        'acknowledged_at',
        'resolved_at',
        'closed_at',
        'last_activity_at',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'incident_date' => 'date',
            'acknowledged_at' => 'datetime',
            'resolved_at' => 'datetime',
            'closed_at' => 'datetime',
            'last_activity_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    public function submitter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by_user_id');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to_user_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class);
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function route(): BelongsTo
    {
        return $this->belongsTo(Route::class);
    }

    public function updates(): HasMany
    {
        return $this->hasMany(ComplaintUpdate::class)->orderBy('created_at');
    }
}
