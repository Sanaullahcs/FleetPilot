<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RunAssignment extends Model
{
    use HasUuids;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'run_id', 'contractor_id', 'vehicle_id', 'driver_id', 'aide_id', 'service_date',
        'status', 'actual_start_time', 'actual_end_time', 'actual_distance_miles',
        'odometer_start', 'odometer_end', 'notes', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'service_date' => 'date',
            'actual_start_time' => 'datetime',
            'actual_end_time' => 'datetime',
            'actual_distance_miles' => 'float',
            'odometer_start' => 'float',
            'odometer_end' => 'float',
        ];
    }

    public function run(): BelongsTo
    {
        return $this->belongsTo(Run::class);
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class);
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function contractor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'contractor_id');
    }
}
