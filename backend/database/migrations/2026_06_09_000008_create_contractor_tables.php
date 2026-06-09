<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contractor_applications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->nullable()->constrained('organizations')->nullOnDelete();
            $table->foreignUuid('applicant_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('company_name');
            $table->string('contact_name')->nullable();
            $table->string('contact_email')->nullable();
            $table->string('contact_phone', 20)->nullable();
            $table->string('business_type', 100)->nullable();
            $table->string('tax_id', 50)->nullable();
            $table->text('address')->nullable();
            $table->integer('fleet_size')->nullable();
            $table->integer('years_in_business')->nullable();
            $table->json('service_areas')->nullable();
            $table->enum('status', ['submitted', 'under_review', 'approved', 'rejected', 'withdrawn'])->default('submitted');
            $table->foreignUuid('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('review_notes')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('contractor_application_documents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('contractor_application_id');
            $table->foreign('contractor_application_id', 'cad_application_fk')
                ->references('id')->on('contractor_applications')->cascadeOnDelete();
            $table->enum('document_type', ['insurance', 'license', 'w9', 'certification', 'other']);
            $table->string('file_path', 500);
            $table->string('original_filename')->nullable();
            $table->enum('status', ['pending_review', 'approved', 'rejected'])->default('pending_review');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contractor_application_documents');
        Schema::dropIfExists('contractor_applications');
    }
};
