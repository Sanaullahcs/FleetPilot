<?php

namespace App\Support;

final class DemoCredentials
{
    /** Shared demo login password for seeded accounts (local / staging only). */
    public const PASSWORD = 'FleetPilot1!';

    /** @var list<string> */
    public const DEMO_EMAILS = [
        'super@fleetpilot.test',
        'admin@fleetpilot.test',
        'dispatch@fleetpilot.test',
        'driver@fleetpilot.test',
        'parent@fleetpilot.test',
        'school@fleetpilot.test',
    ];
}
