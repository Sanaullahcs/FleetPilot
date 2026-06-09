<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('drivers', function (Blueprint $table) {
            $table->foreignUuid('default_vehicle_id')->nullable()->after('contractor_id')->constrained('vehicles')->nullOnDelete();
        });

        Schema::table('students', function (Blueprint $table) {
            $table->foreignUuid('assigned_driver_id')->nullable()->after('school_id')->constrained('drivers')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropConstrainedForeignId('assigned_driver_id');
        });

        Schema::table('drivers', function (Blueprint $table) {
            $table->dropConstrainedForeignId('default_vehicle_id');
        });
    }
};
