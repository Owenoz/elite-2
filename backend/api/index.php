<?php
require_once __DIR__ . '/cors.php';

// API health check + endpoint listing
respond(true, [
    'name'      => 'Elite Movies API',
    'version'   => '1.0.0',
    'status'    => 'online',
    'endpoints' => [
        'GET  /api/movies'                          => 'List all available movies',
        'GET  /api/movies?tmdb_id={id}'             => 'Get single movie by TMDB id',
        'GET  /api/movies?search={query}'           => 'Search movies by title',
        'POST /api/movies'                          => 'Add/update movie (admin)',
        'GET  /api/payments?email={e}&movie_id={m}' => 'Check payment access',
        'POST /api/payments?action=create'          => 'Start payment + send OTP',
        'POST /api/payments?action=verify'          => 'Verify OTP + unlock movie',
        'POST /api/payments?action=resend'          => 'Resend OTP',
        'GET  /api/downloads?email={e}'             => 'Get all downloads for email',
        'GET  /api/downloads?email={e}&movie_id={m}'=> 'Check single movie access',
        'GET  /api/favorites?email={e}'             => 'Get all favorites',
        'POST /api/favorites'                       => 'Add favorite',
        'DELETE /api/favorites'                     => 'Remove favorite',
        'GET  /api/search?limit={n}'                => 'Get trending searches',
        'POST /api/search'                          => 'Track a search term',
    ],
]);
