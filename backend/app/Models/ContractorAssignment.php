<?php

namespace App\Models;

use App\Models\Concerns\HasUuidAndOrg;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContractorAssignment extends Model
{
    use HasUuidAndOrg;

    protected $fillable = [
        'organization_id', 'contractor_id', 'school_id', 'route_id', 'assigned_by', 'notes',
    ];

    public function contractor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'contractor_id');
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function route(): BelongsTo
    {
        return $this->belongsTo(Route::class);
    }

    public function assignedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }
}
