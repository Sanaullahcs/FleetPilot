<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MobileChatConversation extends Model
{
    use HasUuids;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'organization_id',
        'type',
        'title',
        'participant_user_ids',
        'metadata',
        'last_message_at',
    ];

    protected function casts(): array
    {
        return [
            'participant_user_ids' => 'array',
            'metadata' => 'array',
            'last_message_at' => 'datetime',
        ];
    }

    public function messages(): HasMany
    {
        return $this->hasMany(MobileChatMessage::class, 'conversation_id');
    }
}
