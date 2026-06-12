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
                ."ENUM('driver_support', 'parent_driver', 'parent_school', 'parent_support', 'driver_school', 'staff_direct') NOT NULL"
            );
        }
    }

    public function down(): void
    {
        DB::table('mobile_chat_conversations')
            ->where('type', 'driver_school')
            ->delete();

        if (DB::getDriverName() === 'mysql') {
            DB::statement(
                "ALTER TABLE mobile_chat_conversations MODIFY COLUMN type "
                ."ENUM('driver_support', 'parent_driver', 'parent_school', 'parent_support', 'staff_direct') NOT NULL"
            );
        }
    }
};
