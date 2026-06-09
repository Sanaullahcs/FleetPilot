<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('routes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->string('name');
            $table->string('code', 50)->nullable();
            $table->foreignUuid('school_id')->nullable()->constrained('schools')->nullOnDelete();
            $table->enum('type', ['am', 'pm', 'midday', 'activity', 'sped', 'charter'])->default('am');
            $table->json('days_of_week')->nullable();
            $table->enum('status', ['active', 'inactive', 'draft'])->default('active');
            $table->text('description')->nullable();
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('runs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('route_id')->constrained('routes')->cascadeOnDelete();
            $table->string('name');
            $table->time('scheduled_start_time')->nullable();
            $table->time('scheduled_end_time')->nullable();
            $table->enum('direction', ['to_school', 'from_school', 'other'])->default('to_school');
            $table->decimal('estimated_distance_miles', 8, 2)->nullable();
            $table->integer('estimated_duration_minutes')->nullable();
            $table->enum('status', ['active', 'inactive', 'draft'])->default('active');
            $table->date('effective_date')->nullable();
            $table->date('end_date')->nullable();
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('run_stops', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('run_id')->constrained('runs')->cascadeOnDelete();
            $table->foreignUuid('stop_id')->constrained('stops')->cascadeOnDelete();
            $table->integer('sequence');
            $table->time('scheduled_time')->nullable();
            $table->time('estimated_arrival')->nullable();
            $table->decimal('distance_from_previous_miles', 8, 2)->nullable();
            $table->timestamps();

            $table->unique(['run_id', 'sequence']);
        });

        Schema::create('student_stop_assignments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignUuid('run_id')->constrained('runs')->cascadeOnDelete();
            $table->foreignUuid('stop_id')->constrained('stops')->cascadeOnDelete();
            $table->enum('type', ['pickup', 'dropoff', 'both'])->default('both');
            $table->date('effective_date')->nullable();
            $table->date('end_date')->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
        });

        Schema::create('run_assignments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('run_id')->constrained('runs')->cascadeOnDelete();
            $table->foreignUuid('vehicle_id')->nullable()->constrained('vehicles')->nullOnDelete();
            $table->foreignUuid('driver_id')->nullable()->constrained('drivers')->nullOnDelete();
            $table->foreignUuid('aide_id')->nullable()->constrained('drivers')->nullOnDelete();
            $table->date('service_date');
            $table->enum('status', ['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'])->default('scheduled');
            $table->timestamp('actual_start_time')->nullable();
            $table->timestamp('actual_end_time')->nullable();
            $table->decimal('actual_distance_miles', 8, 2)->nullable();
            $table->decimal('odometer_start', 10, 1)->nullable();
            $table->decimal('odometer_end', 10, 1)->nullable();
            $table->text('notes')->nullable();
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['run_id', 'service_date']);
        });

        Schema::create('run_events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('run_assignment_id')->constrained('run_assignments')->cascadeOnDelete();
            $table->foreignUuid('stop_id')->nullable()->constrained('stops')->nullOnDelete();
            $table->foreignUuid('student_id')->nullable()->constrained('students')->nullOnDelete();
            $table->enum('event_type', [
                'run_start', 'run_end', 'stop_arrival', 'stop_departure',
                'student_pickup', 'student_dropoff', 'student_no_show',
                'breakdown', 'incident', 'delay',
            ]);
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->decimal('odometer', 10, 1)->nullable();
            $table->timestamp('event_time');
            $table->text('notes')->nullable();
            $table->foreignUuid('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index('run_assignment_id');
            $table->index('event_type');
        });

        Schema::create('route_optimizations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignUuid('run_id')->nullable()->constrained('runs')->nullOnDelete();
            $table->foreignUuid('requested_by')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('status', ['pending', 'processing', 'completed', 'failed'])->default('pending');
            $table->json('input_payload')->nullable();
            $table->json('result_payload')->nullable();
            $table->decimal('distance_saved_miles', 8, 2)->nullable();
            $table->integer('time_saved_minutes')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('route_optimizations');
        Schema::dropIfExists('run_events');
        Schema::dropIfExists('run_assignments');
        Schema::dropIfExists('student_stop_assignments');
        Schema::dropIfExists('run_stops');
        Schema::dropIfExists('runs');
        Schema::dropIfExists('routes');
    }
};
