<?php

namespace App\Models\Concerns;

use App\Models\Organization;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Shared behaviour for tenant-scoped models that use UUID primary keys.
 */
trait HasUuidAndOrg
{
    use HasUuids;

    public function initializeHasUuidAndOrg(): void
    {
        $this->keyType = 'string';
        $this->incrementing = false;
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * Limit a query to a single organization.
     */
    public function scopeForOrganization(Builder $query, ?string $organizationId): Builder
    {
        return $query->where('organization_id', $organizationId);
    }
}
