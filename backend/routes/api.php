<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DispatchController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\FleetRadarController;
use App\Http\Controllers\Api\DriverController;
use App\Http\Controllers\Api\DriverPortalController;
use App\Http\Controllers\Api\MobileChatController;
use App\Http\Controllers\Api\MobileController;
use App\Http\Controllers\Api\ParentController;
use App\Http\Controllers\Api\ParentPortalController;
use App\Http\Controllers\Api\OrganizationController;
use App\Http\Controllers\Api\RouteController;
use App\Http\Controllers\Api\SchoolController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\RegistrationController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\VehicleController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes (prefix: /api/v1)
|--------------------------------------------------------------------------
| The full endpoint map lives in docs/03_API_SPECIFICATION.md and
| docs/OPENAPI_SPEC.yaml. Modules (auth, routes, runs, driver, parent,
| billing, on-demand, etc.) are added per the development roadmap.
*/

Route::get('/health', function () {
    return response()->json([
        'success' => true,
        'data' => [
            'service' => 'fleetpilot-api',
            'status' => 'ok',
            'version' => 'v1',
            'time' => now()->toIso8601String(),
        ],
    ]);
});

Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);

    Route::prefix('signup')->group(function () {
        Route::get('/organizations', [RegistrationController::class, 'organizations']);
        Route::get('/organizations/{organization}/admins', [RegistrationController::class, 'organizationAdmins']);
        Route::get('/organizations/{organization}/schools', [RegistrationController::class, 'organizationSchools']);
        Route::post('/register', [RegistrationController::class, 'register']);
    });

    Route::middleware('auth:api')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::put('/me', [AuthController::class, 'updateProfile']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/refresh', [AuthController::class, 'refresh']);
        Route::delete('/account', [AuthController::class, 'deleteAccount']);
    });
});

Route::get('/mobile/app-info', [MobileController::class, 'appInfo']);

Route::middleware('auth:api')->group(function () {
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
    Route::get('/dashboard/analytics', [DashboardController::class, 'analytics']);
    Route::get('/dashboard/notifications', [DashboardController::class, 'notifications']);
    Route::get('/fleet/live', [FleetRadarController::class, 'live'])->middleware('permission:vehicles.view');

    Route::get('/dispatch/runs', [DispatchController::class, 'runsToday'])->middleware('permission:routes.view');
    Route::post('/dispatch/runs/{run}/assign', [DispatchController::class, 'assign'])->middleware('permission:routes.update');
    Route::patch('/dispatch/assignments/{assignment}', [DispatchController::class, 'updateAssignment'])->middleware('permission:routes.update');
    Route::patch('/dispatch/assignments/{assignment}/cancel', [DispatchController::class, 'cancelAssignment'])->middleware('permission:routes.update');

    Route::get('/parent/children', [ParentPortalController::class, 'children']);
    Route::get('/parent/profile', [ParentPortalController::class, 'profile']);
    Route::put('/parent/profile', [ParentPortalController::class, 'updateProfile']);
    Route::get('/parent/tracking', [ParentPortalController::class, 'tracking']);

    Route::get('/driver/runs/today', [DriverPortalController::class, 'runsToday']);
    Route::get('/driver/profile', [DriverPortalController::class, 'profile']);
    Route::put('/driver/profile', [DriverPortalController::class, 'updateProfile']);
    Route::get('/driver/assignments/{assignment}', [DriverPortalController::class, 'assignmentShow']);
    Route::post('/driver/assignments/{assignment}/start', [DriverPortalController::class, 'startAssignment']);
    Route::post('/driver/assignments/{assignment}/stops/{runStop}/complete', [DriverPortalController::class, 'completeStop']);
    Route::get('/mobile/notifications', [MobileController::class, 'notifications']);
    Route::get('/mobile/support', [MobileController::class, 'support']);
    Route::get('/mobile/chat/conversations', [MobileChatController::class, 'conversations']);
    Route::get('/mobile/chat/conversations/{conversation}/messages', [MobileChatController::class, 'messages']);
    Route::post('/mobile/chat/conversations/{conversation}/messages', [MobileChatController::class, 'send']);

    // Parents (admin)
    Route::get('/parents', [ParentController::class, 'index'])->middleware('permission:students.view');
    Route::get('/parents/{parentAccount}', [ParentController::class, 'show'])->middleware('permission:students.view');
    Route::post('/parents', [ParentController::class, 'store'])->middleware('permission:students.create');
    Route::put('/parents/{parentAccount}', [ParentController::class, 'update'])->middleware('permission:students.update');
    Route::delete('/parents/{parentAccount}', [ParentController::class, 'destroy'])->middleware('permission:students.delete');
    Route::get('/parents/{parentAccount}/students', [ParentController::class, 'listStudents'])->middleware('permission:students.update');
    Route::post('/parents/{parentAccount}/students', [ParentController::class, 'linkStudent'])->middleware('permission:students.update');
    Route::delete('/parents/{parentAccount}/students/{parentStudent}', [ParentController::class, 'unlinkStudent'])->middleware('permission:students.update');

    // Students
    Route::get('/students', [StudentController::class, 'index'])->middleware('permission:students.view');
    Route::get('/students/{student}', [StudentController::class, 'show'])->middleware('permission:students.view');
    Route::post('/students', [StudentController::class, 'store'])->middleware('permission:students.create');
    Route::put('/students/{student}', [StudentController::class, 'update'])->middleware('permission:students.update');
    Route::patch('/students/{student}/assign-driver', [StudentController::class, 'assignDriver'])->middleware('permission:students.update');
    Route::patch('/students/{student}/status', [StudentController::class, 'updateStatus'])->middleware('permission:students.update');
    Route::get('/students/{student}/parents', [StudentController::class, 'listParents'])->middleware('permission:students.update');
    Route::post('/students/{student}/parents', [StudentController::class, 'linkParent'])->middleware('permission:students.update');
    Route::delete('/students/{student}/parents/{parentStudent}', [StudentController::class, 'unlinkParent'])->middleware('permission:students.update');
    Route::delete('/students/{student}', [StudentController::class, 'destroy'])->middleware('permission:students.delete');

    // Drivers
    Route::get('/drivers/student-assignments', [DriverController::class, 'studentAssignments'])->middleware('permission:drivers.view');
    Route::get('/drivers', [DriverController::class, 'index'])->middleware('permission:drivers.view');
    Route::get('/drivers/{driver}', [DriverController::class, 'show'])->middleware('permission:drivers.view');
    Route::post('/drivers', [DriverController::class, 'store'])->middleware('permission:drivers.create');
    Route::put('/drivers/{driver}', [DriverController::class, 'update'])->middleware('permission:drivers.update');
    Route::patch('/drivers/{driver}/assign-vehicle', [DriverController::class, 'assignVehicle'])->middleware('permission:drivers.update');
    Route::patch('/drivers/{driver}/status', [DriverController::class, 'updateStatus'])->middleware('permission:drivers.update');
    Route::delete('/drivers/{driver}', [DriverController::class, 'destroy'])->middleware('permission:drivers.delete');

    // Vehicles
    Route::get('/vehicles', [VehicleController::class, 'index'])->middleware('permission:vehicles.view');
    Route::get('/vehicles/{vehicle}', [VehicleController::class, 'show'])->middleware('permission:vehicles.view');
    Route::post('/vehicles', [VehicleController::class, 'store'])->middleware('permission:vehicles.create');
    Route::put('/vehicles/{vehicle}', [VehicleController::class, 'update'])->middleware('permission:vehicles.update');
    Route::patch('/vehicles/{vehicle}/assign-driver', [VehicleController::class, 'assignDriver'])->middleware('permission:vehicles.update');
    Route::patch('/vehicles/{vehicle}/status', [VehicleController::class, 'updateStatus'])->middleware('permission:vehicles.update');
    Route::delete('/vehicles/{vehicle}', [VehicleController::class, 'destroy'])->middleware('permission:vehicles.delete');

    // Schools
    Route::get('/schools/stats', [SchoolController::class, 'stats'])->middleware('permission:schools.view');
    Route::get('/schools/filter-options', [SchoolController::class, 'filterOptions'])->middleware('permission:schools.view');
    Route::get('/schools', [SchoolController::class, 'index'])->middleware('permission:schools.view');
    Route::get('/schools/{school}', [SchoolController::class, 'show'])->middleware('permission:schools.view');
    Route::post('/schools', [SchoolController::class, 'store'])->middleware('permission:schools.create');
    Route::put('/schools/{school}', [SchoolController::class, 'update'])->middleware('permission:schools.update');
    Route::delete('/schools/{school}', [SchoolController::class, 'destroy'])->middleware('permission:schools.delete');

    // Routes
    Route::get('/routes', [RouteController::class, 'index'])->middleware('permission:routes.view');
    Route::get('/routes/{route}', [RouteController::class, 'show'])->middleware('permission:routes.view');
    Route::post('/routes', [RouteController::class, 'store'])->middleware('permission:routes.create');
    Route::put('/routes/{route}', [RouteController::class, 'update'])->middleware('permission:routes.update');
    Route::patch('/routes/{route}/status', [RouteController::class, 'updateStatus'])->middleware('permission:routes.update');
    Route::delete('/routes/{route}', [RouteController::class, 'destroy'])->middleware('permission:routes.delete');

    // Users & access control (admin)
    Route::get('/users', [UserController::class, 'index'])->middleware('permission:users.view');
    Route::get('/users/{user}', [UserController::class, 'show'])->middleware('permission:users.view');
    Route::post('/users', [UserController::class, 'store'])->middleware('permission:users.create');
    Route::put('/users/{user}', [UserController::class, 'update'])->middleware('permission:users.update');
    Route::post('/users/{user}/reset-password', [UserController::class, 'resetPassword'])->middleware('permission:users.update');
    Route::post('/users/{user}/toggle-active', [UserController::class, 'toggleActive'])->middleware('permission:users.update');
    Route::delete('/users/{user}', [UserController::class, 'destroy'])->middleware('permission:users.delete');

    Route::get('/roles', [RoleController::class, 'index'])->middleware('permission:users.view');
    Route::get('/permissions', [RoleController::class, 'permissions'])->middleware('permission:users.view');
    Route::put('/roles/{role}/permissions', [RoleController::class, 'updatePermissions'])->middleware('permission:users.update');

    // Platform super admin
    Route::middleware('super_admin')->prefix('organizations')->group(function () {
        Route::get('/', [OrganizationController::class, 'index']);
        Route::post('/', [OrganizationController::class, 'store']);
        Route::get('/{organization}', [OrganizationController::class, 'show']);
        Route::put('/{organization}', [OrganizationController::class, 'update']);
        Route::delete('/{organization}', [OrganizationController::class, 'destroy']);
    });
});
