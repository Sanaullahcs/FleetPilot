<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ParentStudent extends Model
{
    use HasUuids;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'parent_account_id', 'student_id', 'relationship', 'is_primary', 'can_pickup',
    ];

    protected function casts(): array
    {
        return [
            'is_primary' => 'boolean',
            'can_pickup' => 'boolean',
        ];
    }

    public function parentAccount(): BelongsTo
    {
        return $this->belongsTo(ParentAccount::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}
