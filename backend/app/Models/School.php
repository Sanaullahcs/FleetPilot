<?php

namespace App\Models;

use App\Models\Concerns\HasUuidAndOrg;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class School extends Model
{
    use HasUuidAndOrg;

    protected $fillable = [
        'organization_id', 'name', 'code', 'district', 'grade_levels',
        'address', 'city', 'state', 'zip',
        'timezone', 'phone', 'contact_name', 'contact_email', 'contact_phone',
        'principal_name', 'website',
        'bell_times', 'latitude', 'longitude',
    ];

    protected function casts(): array
    {
        return [
            'bell_times' => 'array',
            'latitude' => 'float',
            'longitude' => 'float',
        ];
    }

    public function students(): HasMany
    {
        return $this->hasMany(Student::class);
    }

    public function routes(): HasMany
    {
        return $this->hasMany(Route::class);
    }
}
