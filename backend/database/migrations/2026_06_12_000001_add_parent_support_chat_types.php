<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement(
                "ALTER TABLE mobile_chat_conversations MODIFY COLUMN type "
                ."ENUM('driver_support', 'parent_driver', 'parent_school', 'parent_support', 'staff_direct') NOT NULL"
            );
        }

        $rows = DB::table('mobile_chat_conversations')->where('type', 'driver_support')->get();

        foreach ($rows as $row) {
            $participantIds = json_decode($row->participant_user_ids, true) ?: [];
            if ($participantIds === []) {
                continue;
            }

            $roles = DB::table('users')->whereIn('id', $participantIds)->pluck('role')->all();
            $hasParent = in_array('parent', $roles, true);
            $hasDriver = in_array('driver', $roles, true);

            if ($hasParent && ! $hasDriver) {
                DB::table('mobile_chat_conversations')->where('id', $row->id)->update([
                    'type' => 'parent_support',
                    'title' => 'Transportation office',
                    'metadata' => json_encode(array_merge(
                        json_decode($row->metadata, true) ?: [],
                        [
                            'subtitle' => 'Dispatch & route help',
                            'avatar_type' => 'support',
                        ],
                    )),
                ]);
            }
        }
    }

    public function down(): void
    {
        DB::table('mobile_chat_conversations')
            ->where('type', 'parent_support')
            ->update(['type' => 'driver_support']);

        DB::table('mobile_chat_conversations')
            ->where('type', 'staff_direct')
            ->delete();

        if (DB::getDriverName() === 'mysql') {
            DB::statement(
                "ALTER TABLE mobile_chat_conversations MODIFY COLUMN type "
                ."ENUM('driver_support', 'parent_driver', 'parent_school') NOT NULL"
            );
        }
    }
};
