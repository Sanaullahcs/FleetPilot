<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE users MODIFY role ENUM(
            'super_admin',
            'admin',
            'dispatcher',
            'driver',
            'contractor',
            'school_contact',
            'parent'
        ) NOT NULL");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE users MODIFY role ENUM(
            'admin',
            'dispatcher',
            'driver',
            'contractor',
            'school_contact',
            'parent'
        ) NOT NULL");
    }
};
