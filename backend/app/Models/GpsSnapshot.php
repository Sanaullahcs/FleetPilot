<?php

namespace App\Models;

use App\Models\Concerns\HasUuidAndOrg;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GpsSnapshot extends Model
{
    use HasUuidAndOrg;

    protected $fillable = [
        'organization_id',
        'vehicle_id',
        'run_assignment_id',
        'latitude',
        'longitude',
        'heading',
        'speed_mph',
        'odometer',
        'recorded_at',
        'source',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'float',
            'longitude' => 'float',
            'heading' => 'float',
            'speed_mph' => 'float',
            'odometer' => 'float',
            'recorded_at' => 'datetime',
        ];
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }
}
