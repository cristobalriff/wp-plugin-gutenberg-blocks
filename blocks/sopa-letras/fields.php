<?php
if ( function_exists( 'acf_add_local_field_group' ) ) :

	acf_add_local_field_group( array(
		'key' => 'group_sopa_letras',
		'title' => 'Bloque: Sopa de Letras',
		'fields' => array(
			array(
				'key' => 'field_sopa_letras_title',
				'label' => 'Título',
				'name' => 'title',
				'type' => 'text',
				'instructions' => 'Título principal del juego',
				'required' => 1,
				'default_value' => 'Sopa de Letras',
			),
			array(
				'key' => 'field_sopa_letras_description',
				'label' => 'Descripción',
				'name' => 'description',
				'type' => 'textarea',
				'instructions' => 'Breve descripción o instrucciones',
				'rows' => 3,
			),
			array(
				'key' => 'field_sopa_letras_grid_size',
				'label' => 'Tamaño de la Grilla',
				'name' => 'grid_size',
				'type' => 'select',
				'instructions' => 'Selecciona el tamaño del tablero',
				'required' => 1,
				'choices' => array(
					'16' => '16x16',
					'20' => '20x20',
					'28' => '28x28',
				),
				'default_value' => '16',
				'return_format' => 'value',
			),
			array(
				'key' => 'field_sopa_letras_words',
				'label' => 'Palabras y Pistas',
				'name' => 'words_clues',
				'type' => 'repeater',
				'instructions' => 'Añade las palabras a buscar y sus pistas',
				'required' => 1,
				'min' => 1,
				'layout' => 'table',
				'sub_fields' => array(
					array(
						'key' => 'field_sopa_letras_word',
						'label' => 'Palabra',
						'name' => 'word',
						'type' => 'text',
						'required' => 1,
						'instructions' => 'Sin espacios ni caracteres especiales. Se convertirá a mayúsculas.',
					),
					array(
						'key' => 'field_sopa_letras_clue',
						'label' => 'Pista',
						'name' => 'clue',
						'type' => 'text',
						'required' => 1,
					),
				),
			),
		),
		'location' => array(
			array(
				array(
					'param' => 'block',
					'operator' => '==',
					'value' => 'acf/sopa-letras',
				),
			),
		),
	) );

endif;
