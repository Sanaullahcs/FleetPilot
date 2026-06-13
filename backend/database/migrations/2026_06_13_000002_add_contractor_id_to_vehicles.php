<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Contractors bring their own fleet. Drivers already carry contractor_id;
     * vehicles need the same so a contractor only manages their own vehicles.
     */
    public function up(): void
    {
        Schema::table('vehicles', function (Blueprint $table) {
            $table->foreignUuid('contractor_id')->nullable()->after('organization_id')
                ->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('vehicles', function (Blueprint $table) {
            $table->dropConstrainedForeignId('contractor_id');
        });
    }
};
