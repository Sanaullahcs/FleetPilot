<?php

namespace App\Models;

use App\Models\Concerns\HasUuidAndOrg;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Stop extends Model
{
    use HasUuidAndOrg;

    protected $fillable = [
        'organization_id', 'name', 'code', 'address', 'city', 'state', 'zip',
        'latitude', 'longitude', 'type', 'is_wheelchair_accessible', 'notes',
        'school_id',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'float',
            'longitude' => 'float',
            'is_wheelchair_accessible' => 'boolean',
        ];
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }
}
