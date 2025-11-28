<?php
/**
 * Sopa de Letras Block Template.
 *
 * @param   array $block The block settings and attributes.
 * @param   string $content The block inner HTML (empty).
 * @param   bool $is_preview True during backend preview render.
 * @param   int $post_id The post ID the block is rendering content against.
 *          This is either the post ID currently being displayed inside a query loop,
 *          or the post ID of the post hosting this block.
 * @param   array $context The context provided to the block by the post or it's parent block.
 */

// Support custom "anchor" values.
$anchor = '';
if (!empty($block['anchor'])) {
    $anchor = 'id="' . esc_attr($block['anchor']) . '" ';
}

// Create class attribute allowing for custom "className" and "align" values.
$class_name = 'acfb-sopa-letras-block';
if (!empty($block['className'])) {
    $class_name .= ' ' . $block['className'];
}
if (!empty($block['align'])) {
    $class_name .= ' align' . $block['align'];
}

// Load values and assign defaults.
$title = get_field('title') ?: 'Sopa de Letras';
$description = get_field('description');
$grid_size = get_field('grid_size') ?: 16;
$words_clues = get_field('words_clues') ?: [];

// Prepare configuration for JS
$game_config = [
    'gridSize' => (int) $grid_size,
    'words' => [],
];

foreach ($words_clues as $item) {
    if (!empty($item['word']) && !empty($item['clue'])) {
        $game_config['words'][] = [
            'word' => strtoupper(trim($item['word'])),
            'clue' => $item['clue'],
        ];
    }
}

$config_json = htmlspecialchars(json_encode($game_config), ENT_QUOTES, 'UTF-8');
$unique_id = 'sopa-letras-' . uniqid();
?>

<script>
    window.wp_plugin_gutenberg_blocks = window.wp_plugin_gutenberg_blocks || {};
    window.wp_plugin_gutenberg_blocks.plugin_url = '<?php echo esc_url(plugin_dir_url(dirname(__FILE__, 3) . "/plugin.php")); ?>';
</script>

<style>
    @keyframes acfb-bounce {

        0%,
        100% {
            transform: translateY(0) scale(1);
        }

        50% {
            transform: translateY(-20px) scale(1.05);
        }
    }

    @keyframes acfb-dance {

        0%,
        100% {
            transform: translateY(0) rotate(0deg);
        }

        25% {
            transform: translateY(-10px) rotate(-5deg);
        }

        75% {
            transform: translateY(-10px) rotate(5deg);
        }
    }

    @keyframes acfb-sparkle {
        0% {
            opacity: 1;
            transform: scale(0) rotate(0deg);
        }

        50% {
            opacity: 1;
            transform: scale(1.5) rotate(180deg);
        }

        100% {
            opacity: 0;
            transform: scale(0) rotate(360deg);
        }
    }

    @keyframes acfb-fade-out {
        from {
            opacity: 1;
            transform: scale(1);
        }

        to {
            opacity: 0;
            transform: scale(0.8);
        }
    }
</style>

<div <?php echo $anchor; ?>class="<?php echo esc_attr($class_name); ?> acfb-bg-yellow-300 acfb-p-8 acfb-font-sans"
    data-game-config="<?php echo $config_json; ?>" id="<?php echo esc_attr($unique_id); ?>">

    <!-- Header -->
    <header
        class="acfb-bg-white acfb-border-4 acfb-border-black acfb-p-6 acfb-mb-8 acfb-shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div class="acfb-flex acfb-flex-col md:acfb-flex-row acfb-justify-between acfb-items-center acfb-gap-6">
            <div>
                <h2 class="acfb-text-4xl acfb-font-black acfb-text-black acfb-m-0 acfb-uppercase acfb-tracking-tight">
                    <?php echo esc_html($title); ?>
                </h2>
                <?php if ($description): ?>
                    <p class="acfb-text-black acfb-mt-2 acfb-font-bold acfb-text-lg">
                        <?php echo esc_html($description); ?>
                    </p>
                <?php endif; ?>
            </div>

            <div class="acfb-flex acfb-items-center acfb-gap-4 acfb-flex-wrap">
                <div
                    class="acfb-bg-cyan-300 acfb-border-4 acfb-border-black acfb-px-4 acfb-py-2 acfb-shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div class="acfb-text-xs acfb-font-black acfb-uppercase acfb-mb-1">TIEMPO</div>
                    <div class="timer-display acfb-text-2xl acfb-font-black acfb-font-mono">00:00</div>
                </div>
                <div
                    class="acfb-bg-pink-300 acfb-border-4 acfb-border-black acfb-px-4 acfb-py-2 acfb-shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div class="acfb-text-xs acfb-font-black acfb-uppercase acfb-mb-1">PUNTOS</div>
                    <div class="score-display acfb-text-2xl acfb-font-black acfb-font-mono">0</div>
                </div>
                <div
                    class="acfb-bg-red-300 acfb-border-4 acfb-border-black acfb-px-4 acfb-py-2 acfb-shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div class="acfb-text-xs acfb-font-black acfb-uppercase acfb-mb-1">ERRORES</div>
                    <div class="errors-display acfb-text-2xl acfb-font-black acfb-font-mono">0</div>
                </div>
            </div>

            <!-- Grid Size Selector -->
            <div
                class="acfb-bg-white acfb-border-4 acfb-border-black acfb-p-2 acfb-shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div class="acfb-text-xs acfb-font-black acfb-uppercase acfb-mb-2 acfb-text-center">TAMAÑO</div>
                <div class="acfb-flex acfb-gap-2">
                    <button data-grid-size="12"
                        class="grid-size-btn acfb-bg-purple-300 acfb-text-black acfb-font-black acfb-px-3 acfb-py-2 acfb-border-2 acfb-border-black acfb-text-xs acfb-uppercase acfb-transition-all hover:acfb-bg-purple-400 acfb-shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        12x12
                    </button>
                    <button data-grid-size="16"
                        class="grid-size-btn acfb-bg-lime-300 acfb-text-black acfb-font-black acfb-px-3 acfb-py-2 acfb-border-4 acfb-border-black acfb-text-xs acfb-uppercase acfb-transition-all acfb-shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                        16x16
                    </button>
                    <button data-grid-size="20"
                        class="grid-size-btn acfb-bg-orange-300 acfb-text-black acfb-font-black acfb-px-3 acfb-py-2 acfb-border-2 acfb-border-black acfb-text-xs acfb-uppercase acfb-transition-all hover:acfb-bg-orange-400 acfb-shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        20x20
                    </button>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="acfb-flex acfb-gap-4">
                <button
                    class="give-up-btn acfb-bg-red-400 hover:acfb-bg-red-300 acfb-text-black acfb-font-black acfb-py-3 acfb-px-6 acfb-border-4 acfb-border-black acfb-shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:acfb-shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:acfb-shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:acfb-translate-x-[2px] active:acfb-translate-y-[2px] acfb-uppercase acfb-text-sm acfb-transition-all">
                    Rendirse
                </button>
                <button
                    class="reset-btn acfb-bg-yellow-400 hover:acfb-bg-yellow-300 acfb-text-black acfb-font-black acfb-py-3 acfb-px-6 acfb-border-4 acfb-border-black acfb-shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:acfb-shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:acfb-shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:acfb-translate-x-[2px] active:acfb-translate-y-[2px] acfb-uppercase acfb-text-sm acfb-transition-all">
                    Reiniciar
                </button>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class="acfb-flex acfb-flex-col md:acfb-flex-row acfb-gap-8">

        <!-- Grid Section -->
        <section class="acfb-flex-grow acfb-flex acfb-justify-center acfb-items-start acfb-overflow-auto">
            <div
                class="acfb-bg-white acfb-border-2 acfb-border-black acfb-p-6 acfb-shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] acfb-select-none">
                <div class="grid-container acfb-grid acfb-gap-1 acfb-bg-black acfb-p-4">
                    <!-- Grid generated by JS -->
                </div>
            </div>
        </section>

        <!-- Sidebar / Clues -->
        <aside class="acfb-w-full md:acfb-w-80 lg:acfb-w-96 acfb-flex acfb-flex-col acfb-gap-4">
            <div
                class="acfb-bg-white acfb-border-4 acfb-border-black acfb-p-6 acfb-shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] acfb-flex-grow">
                <h3
                    class="acfb-text-2xl acfb-font-black acfb-mb-4 acfb-uppercase acfb-border-b-4 acfb-border-black acfb-pb-3">
                    Pistas</h3>
                <div class="acfb-flex acfb-justify-between acfb-text-sm acfb-font-bold acfb-mb-4 acfb-uppercase">
                    <span>Encontradas: <span class="found-count acfb-text-xl acfb-font-black">0</span>/<span
                            class="total-count acfb-text-xl acfb-font-black">0</span></span>
                </div>
                <ul class="clue-list acfb-space-y-3 acfb-max-h-[60vh] acfb-overflow-y-auto acfb-pr-2">
                    <!-- Clues injected by JS -->
                </ul>
            </div>
        </aside>

    </main>

    <!-- Success Modal -->
    <div
        class="success-modal acfb-fixed acfb-inset-0 acfb-bg-black/70 acfb-z-50 acfb-hidden acfb-flex acfb-items-center acfb-justify-center acfb-p-4">
        <div
            class="acfb-bg-lime-300 acfb-border-6 acfb-border-black acfb-shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] acfb-p-10 acfb-max-w-md acfb-w-full acfb-text-center acfb-relative acfb-max-h-[90vh] acfb-overflow-y-auto">

            <!-- Close Button (X) -->
            <button
                class="close-modal-btn acfb-absolute acfb-top-4 acfb-right-4 acfb-w-10 acfb-h-10 acfb-bg-red-400 hover:acfb-bg-red-500 acfb-border-4 acfb-border-black acfb-flex acfb-items-center acfb-justify-center acfb-font-black acfb-text-2xl acfb-shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:acfb-shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:acfb-shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:acfb-translate-x-[2px] active:acfb-translate-y-[2px] acfb-transition-all acfb-cursor-pointer"
                aria-label="Cerrar">
                ✕
            </button>

            <div
                class="acfb-w-24 acfb-h-24 acfb-bg-white acfb-border-4 acfb-border-black acfb-flex acfb-items-center acfb-justify-center acfb-mx-auto acfb-mb-6 acfb-shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <svg class="acfb-w-16 acfb-h-16 acfb-text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M5 13l4 4L19 7"></path>
                </svg>
            </div>
            <h2 class="acfb-text-4xl acfb-font-black acfb-text-black acfb-mb-4 acfb-uppercase">
                ¡Felicitaciones!</h2>
            <div class="modal-message acfb-text-black acfb-mb-8 acfb-font-bold acfb-text-lg">Has encontrado todas
                las palabras.</div>

            <div class="acfb-grid acfb-grid-cols-2 acfb-gap-4 acfb-mb-8">
                <div
                    class="acfb-bg-cyan-300 acfb-border-4 acfb-border-black acfb-p-4 acfb-shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <p class="acfb-text-xs acfb-font-black acfb-uppercase acfb-mb-2">
                        Tiempo</p>
                    <p class="final-time acfb-text-2xl acfb-font-black acfb-font-mono">
                        00:00</p>
                </div>
                <div
                    class="acfb-bg-pink-300 acfb-border-4 acfb-border-black acfb-p-4 acfb-shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <p class="acfb-text-xs acfb-font-black acfb-uppercase acfb-mb-2">
                        Puntuación</p>
                    <p class="final-score acfb-text-2xl acfb-font-black acfb-font-mono">
                        0</p>
                </div>
            </div>

            <button
                class="play-again-btn acfb-w-full acfb-bg-yellow-400 hover:acfb-bg-yellow-300 acfb-text-black acfb-font-black acfb-py-4 acfb-px-8 acfb-border-4 acfb-border-black acfb-shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:acfb-shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:acfb-shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:acfb-translate-x-[2px] active:acfb-translate-y-[2px] acfb-uppercase acfb-text-lg acfb-transition-all">
                Jugar de nuevo
            </button>
        </div>
    </div>

</div>