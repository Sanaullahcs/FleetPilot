<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

trait SortsQueries
{
    /**
     * @param  Builder<\Illuminate\Database\Eloquent\Model>  $query
     * @param  array<int, string>  $allowed
     */
    protected function applyListSort(Builder $query, Request $request, array $allowed, string $defaultColumn, string $defaultDir = 'asc'): void
    {
        $sortBy = $request->string('sort_by')->toString();
        $dir = strtolower($request->string('sort_dir')->toString()) === 'desc' ? 'desc' : 'asc';

        if ($sortBy !== '' && in_array($sortBy, $allowed, true)) {
            $query->orderBy($sortBy, $dir);

            return;
        }

        $query->orderBy($defaultColumn, $defaultDir);
    }
}
