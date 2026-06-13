<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Links a contractor (a user with role=contractor) to the schools and/or
     * routes an organization admin has delegated to them. Only admins manage
     * these rows; schools never assign contractors directly.
     */
    public function up(): void
    {
        Schema::create('contractor_assignments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignUuid('contractor_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('school_id')->nullable()->constrained('schools')->cascadeOnDelete();
            $table->foreignUuid('route_id')->nullable()->constrained('routes')->cascadeOnDelete();
            $table->foreignUuid('assigned_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['contractor_id', 'school_id'], 'contractor_school_unique');
            $table->unique(['contractor_id', 'route_id'], 'contractor_route_unique');
            $table->index(['organization_id', 'contractor_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contractor_assignments');
    }
};
