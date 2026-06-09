<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('on_demand_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignUuid('requested_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('student_id')->nullable()->constrained('students')->nullOnDelete();
            $table->text('pickup_address')->nullable();
            $table->decimal('pickup_latitude', 10, 7)->nullable();
            $table->decimal('pickup_longitude', 10, 7)->nullable();
            $table->text('dropoff_address')->nullable();
            $table->decimal('dropoff_latitude', 10, 7)->nullable();
            $table->decimal('dropoff_longitude', 10, 7)->nullable();
            $table->timestamp('requested_pickup_time')->nullable();
            $table->enum('status', ['pending', 'approved', 'assigned', 'in_progress', 'completed', 'cancelled', 'denied'])->default('pending');
            $table->enum('priority', ['low', 'normal', 'high', 'urgent'])->default('normal');
            $table->foreignUuid('run_id')->nullable()->constrained('runs')->nullOnDelete();
            $table->text('reason')->nullable();
            $table->text('notes')->nullable();
            $table->foreignUuid('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('gps_snapshots', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('vehicle_id')->constrained('vehicles')->cascadeOnDelete();
            $table->foreignUuid('run_assignment_id')->nullable()->constrained('run_assignments')->nullOnDelete();
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->decimal('heading', 6, 2)->nullable();
            $table->decimal('speed_mph', 6, 2)->nullable();
            $table->decimal('odometer', 10, 1)->nullable();
            $table->timestamp('recorded_at');
            $table->enum('source', ['samsara', 'mobile', 'manual'])->default('mobile');
            $table->timestamps();

            $table->index(['vehicle_id', 'recorded_at']);
            $table->index('run_assignment_id');
        });

        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->nullable()->constrained('organizations')->cascadeOnDelete();
            $table->foreignUuid('user_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->string('type', 100);
            $table->enum('channel', ['push', 'sms', 'email', 'in_app'])->default('in_app');
            $table->string('title');
            $table->text('body')->nullable();
            $table->json('data')->nullable();
            $table->enum('status', ['pending', 'sent', 'delivered', 'failed', 'read'])->default('pending');
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
        });

        Schema::create('notification_templates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->nullable()->constrained('organizations')->cascadeOnDelete();
            $table->string('slug', 100);
            $table->string('name');
            $table->enum('channel', ['push', 'sms', 'email', 'in_app'])->default('push');
            $table->string('subject')->nullable();
            $table->text('body_template');
            $table->json('variables')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['organization_id', 'slug']);
        });

        Schema::create('reports', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->string('name');
            $table->string('type', 100);
            $table->json('parameters')->nullable();
            $table->foreignUuid('generated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('file_path', 500)->nullable();
            $table->enum('status', ['pending', 'processing', 'completed', 'failed'])->default('pending');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reports');
        Schema::dropIfExists('notification_templates');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('gps_snapshots');
        Schema::dropIfExists('on_demand_requests');
    }
};
