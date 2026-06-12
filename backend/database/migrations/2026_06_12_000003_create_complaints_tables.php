<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('complaints', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->string('reference_number', 32);
            $table->foreignUuid('submitted_by_user_id')->constrained('users')->cascadeOnDelete();
            $table->enum('submitter_role', ['parent', 'driver', 'school_contact', 'admin', 'dispatcher']);
            $table->enum('category', [
                'safety',
                'route_service',
                'driver_conduct',
                'vehicle_condition',
                'student_issue',
                'billing',
                'communication',
                'app_technical',
                'facility_access',
                'other',
            ]);
            $table->string('subject', 200);
            $table->text('description');
            $table->enum('status', [
                'submitted',
                'acknowledged',
                'in_progress',
                'waiting_on_submitter',
                'resolved',
                'closed',
                'rejected',
            ])->default('submitted');
            $table->enum('priority', ['low', 'normal', 'high', 'urgent'])->default('normal');
            $table->enum('preferred_contact', ['app', 'phone', 'email'])->default('app');
            $table->string('contact_phone', 30)->nullable();
            $table->date('incident_date')->nullable();
            $table->string('location_note', 255)->nullable();
            $table->foreignUuid('student_id')->nullable()->constrained('students')->nullOnDelete();
            $table->foreignUuid('driver_id')->nullable()->constrained('drivers')->nullOnDelete();
            $table->foreignUuid('school_id')->nullable()->constrained('schools')->nullOnDelete();
            $table->foreignUuid('route_id')->nullable()->constrained('routes')->nullOnDelete();
            $table->foreignUuid('assigned_to_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('resolution_summary')->nullable();
            $table->timestamp('acknowledged_at')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->timestamp('last_activity_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->unique(['organization_id', 'reference_number']);
            $table->index(['organization_id', 'status']);
            $table->index(['organization_id', 'submitter_role']);
            $table->index(['submitted_by_user_id', 'created_at']);
            $table->index(['assigned_to_user_id', 'status']);
        });

        Schema::create('complaint_updates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('complaint_id')->constrained('complaints')->cascadeOnDelete();
            $table->foreignUuid('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('type', ['comment', 'status_change', 'assignment', 'internal_note', 'system'])->default('comment');
            $table->text('body');
            $table->boolean('is_internal')->default(false);
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['complaint_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('complaint_updates');
        Schema::dropIfExists('complaints');
    }
};
