<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Run extends Model
{
    use HasUuids;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'route_id', 'name', 'scheduled_start_time', 'scheduled_end_time',
        'direction', 'estimated_distance_miles', 'estimated_duration_minutes',
        'status', 'effective_date', 'end_date', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'estimated_distance_miles' => 'float',
            'estimated_duration_minutes' => 'integer',
            'effective_date' => 'date',
            'end_date' => 'date',
        ];
    }

    public function route(): BelongsTo
    {
        return $this->belongsTo(Route::class);
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(RunAssignment::class);
    }
}
