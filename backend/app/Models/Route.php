<?php

namespace App\Models;

use App\Models\Concerns\HasUuidAndOrg;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Route extends Model
{
    use HasUuidAndOrg;

    protected $fillable = [
        'organization_id', 'name', 'code', 'school_id', 'type',
        'days_of_week', 'status', 'description', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'days_of_week' => 'array',
        ];
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function runs(): HasMany
    {
        return $this->hasMany(Run::class);
    }
}

