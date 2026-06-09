<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('schools', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->string('name');
            $table->string('code', 50)->nullable();
            $table->text('address')->nullable();
            $table->string('city', 100)->nullable();
            $table->string('state', 2)->nullable();
            $table->string('zip', 10)->nullable();
            $table->string('timezone', 50)->nullable();
            $table->string('phone', 20)->nullable();
            $table->string('contact_name')->nullable();
            $table->string('contact_email')->nullable();
            $table->string('contact_phone', 20)->nullable();
            $table->json('bell_times')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->timestamps();
        });

        Schema::create('vehicles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->string('vehicle_number', 50);
            $table->string('vin', 17)->nullable();
            $table->string('make', 100)->nullable();
            $table->string('model', 100)->nullable();
            $table->integer('year')->nullable();
            $table->enum('type', ['bus', 'van', 'minivan', 'sedan', 'wheelchair_van']);
            $table->integer('capacity')->nullable();
            $table->integer('wheelchair_capacity')->default(0);
            $table->string('license_plate', 20)->nullable();
            $table->date('registration_expiry')->nullable();
            $table->date('insurance_expiry')->nullable();
            $table->date('inspection_expiry')->nullable();
            $table->string('samsara_device_id', 100)->nullable();
            $table->string('diga_talk_id', 100)->nullable();
            $table->enum('status', ['active', 'maintenance', 'retired', 'out_of_service'])->default('active');
            $table->decimal('current_odometer', 10, 1)->nullable();
            $table->enum('fuel_type', ['diesel', 'gas', 'electric', 'hybrid'])->nullable();
            $table->string('garage_location')->nullable();
            $table->decimal('cost_per_mile', 6, 2)->nullable();
            $table->timestamps();

            $table->unique(['organization_id', 'vehicle_number']);
        });

        Schema::create('vehicle_documents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('vehicle_id')->constrained('vehicles')->cascadeOnDelete();
            $table->enum('document_type', ['registration', 'insurance', 'inspection', 'maintenance_record']);
            $table->string('file_path', 500);
            $table->string('original_filename')->nullable();
            $table->date('expiry_date')->nullable();
            $table->enum('status', ['active', 'expired', 'pending_review'])->default('active');
            $table->timestamps();
        });

        Schema::create('stops', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->string('name');
            $table->string('code', 50)->nullable();
            $table->text('address')->nullable();
            $table->string('city', 100)->nullable();
            $table->string('state', 2)->nullable();
            $table->string('zip', 10)->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->enum('type', ['student', 'school', 'garage', 'rtc', 'hub', 'other'])->default('student');
            $table->boolean('is_wheelchair_accessible')->default(false);
            $table->text('notes')->nullable();
            $table->foreignUuid('school_id')->nullable()->constrained('schools')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stops');
        Schema::dropIfExists('vehicle_documents');
        Schema::dropIfExists('vehicles');
        Schema::dropIfExists('schools');
    }
};
