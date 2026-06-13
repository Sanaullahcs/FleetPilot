<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('run_assignments', function (Blueprint $table) {
            // When set, the run for this service date has been delegated to a
            // contractor. The contractor then fills driver_id / vehicle_id with
            // their own fleet; school/parent/admin see the same assignment.
            $table->foreignUuid('contractor_id')->nullable()->after('run_id')
                ->constrained('users')->nullOnDelete();
            $table->index('contractor_id');
        });
    }

    public function down(): void
    {
        Schema::table('run_assignments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('contractor_id');
        });
    }
};
