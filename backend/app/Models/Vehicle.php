<?php

namespace App\Models;

use App\Models\Concerns\HasUuidAndOrg;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Vehicle extends Model
{
    use HasUuidAndOrg;

    protected $fillable = [
        'organization_id', 'contractor_id', 'vehicle_number', 'vin', 'make', 'model', 'year',
        'type', 'capacity', 'wheelchair_capacity', 'license_plate',
        'registration_expiry', 'insurance_expiry', 'inspection_expiry',
        'samsara_device_id', 'diga_talk_id', 'status', 'current_odometer',
        'fuel_type', 'garage_location', 'cost_per_mile',
    ];

    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'capacity' => 'integer',
            'wheelchair_capacity' => 'integer',
            'registration_expiry' => 'date',
            'insurance_expiry' => 'date',
            'inspection_expiry' => 'date',
            'current_odometer' => 'float',
            'cost_per_mile' => 'float',
        ];
    }

    public function assignedDriver(): HasOne
    {
        return $this->hasOne(Driver::class, 'default_vehicle_id');
    }

    public function contractor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'contractor_id');
    }
}
