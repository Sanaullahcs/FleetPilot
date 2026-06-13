<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('drivers', function (Blueprint $table) {
            $table->string('insurance_provider', 150)->nullable()->after('license_state');
            $table->string('insurance_policy_number', 80)->nullable()->after('insurance_provider');
            $table->date('insurance_expiry')->nullable()->after('insurance_policy_number');
        });

        DB::statement("ALTER TABLE driver_documents MODIFY document_type ENUM(
            'license', 'medical_cert', 'background_check', 'drug_test',
            'training_cert', 'insurance', 'other'
        ) NOT NULL");
    }

    public function down(): void
    {
        Schema::table('drivers', function (Blueprint $table) {
            $table->dropColumn(['insurance_provider', 'insurance_policy_number', 'insurance_expiry']);
        });

        DB::statement("ALTER TABLE driver_documents MODIFY document_type ENUM(
            'license', 'medical_cert', 'background_check', 'drug_test',
            'training_cert', 'other'
        ) NOT NULL");
    }
};
