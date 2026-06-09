<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('organizations', function (Blueprint $table) {
            $table->string('city', 100)->nullable()->after('address');
            $table->string('state', 2)->nullable()->after('city');
            $table->string('zip', 10)->nullable()->after('state');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->text('address')->nullable()->after('phone');
            $table->string('city', 100)->nullable()->after('address');
            $table->string('state', 2)->nullable()->after('city');
            $table->string('zip', 10)->nullable()->after('state');
            $table->string('job_title', 100)->nullable()->after('zip');
            $table->json('profile_meta')->nullable()->after('job_title');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['address', 'city', 'state', 'zip', 'job_title', 'profile_meta']);
        });

        Schema::table('organizations', function (Blueprint $table) {
            $table->dropColumn(['city', 'state', 'zip']);
        });
    }
};
