<?php
$current = basename($_SERVER['PHP_SELF'], '.php');
$links = [
    'dashboard'  => ['icon' => '📊', 'label' => 'Dashboard'],
    'add-movie'  => ['icon' => '➕', 'label' => 'Add Movie'],
    'movies'     => ['icon' => '🎬', 'label' => 'Movies'],
    'payments'   => ['icon' => '💳', 'label' => 'Payments'],
    'downloads'  => ['icon' => '📥', 'label' => 'Downloads'],
];
?>
<nav class="sidebar">
    <div class="sidebar-brand">
        <span class="crown">👑</span>
        <div>
            <div class="brand-name">ELITE MOVIES</div>
            <div class="brand-sub">Admin Panel</div>
        </div>
    </div>
    <ul class="sidebar-nav">
        <?php foreach ($links as $page => $info): ?>
        <li>
            <a href="<?= $page ?>.php" class="nav-link <?= $current === $page ? 'active' : '' ?>">
                <span><?= $info['icon'] ?></span>
                <?= $info['label'] ?>
            </a>
        </li>
        <?php endforeach; ?>
    </ul>
    <div class="sidebar-footer">
        <a href="logout.php" class="nav-link nav-logout">🚪 Logout</a>
        <div class="sidebar-hint">
            <a href="<?= defined('APP_DOMAIN') ? APP_DOMAIN : '#' ?>" target="_blank" class="link small">View App →</a>
        </div>
    </div>
</nav>
