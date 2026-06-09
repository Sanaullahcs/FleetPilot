<?php

namespace App\Models;

use App\Models\Concerns\HasUuidAndOrg;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ParentAccount extends Model
{
    use HasUuidAndOrg;

    protected $fillable = [
        'organization_id', 'user_id', 'relationship',
        'preferred_language', 'notification_preferences',
    ];

    protected function casts(): array
    {
        return [
            'notification_preferences' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function students(): BelongsToMany
    {
        return $this->belongsToMany(Student::class, 'parent_students', 'parent_account_id', 'student_id')
            ->withPivot(['id', 'relationship', 'is_primary', 'can_pickup'])
            ->withTimestamps();
    }

    public function parentStudents(): HasMany
    {
        return $this->hasMany(ParentStudent::class);
    }
}
