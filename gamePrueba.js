class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.vidas = 3;
        this.estrellasVidas = [];
        this.intentos = 10;
        this.plataformas = [];
        this.bombas = [];
        
        // Obtener operador de la URL
        const urlParams = new URLSearchParams(window.location.search);
        this.operadorActual = urlParams.get('operador') || 'menor';
        this.operadores = ['menor', 'mayor', 'igual'];
        this.operadorIndex = this.operadores.indexOf(this.operadorActual);
        
        this.gameOver = false;
        this.gameWon = false;
    }

    preload() {
        this.load.image('sky', 'assets/sky.png');
        this.load.image('ground', 'assets/platform.png');
        this.load.spritesheet('dude', 'assets/personajee.png', { frameWidth: 39, frameHeight: 48 });
        this.load.image('star', 'assets/star.png');
        this.load.image('escalera', 'assets/escalera.png');
        this.load.image('cuadrado', 'assets/cuadrado.png');
        this.load.image('win', 'assets/win.png');
        this.load.image('obstaculo', 'assets/platformRotada.png');
        this.load.image('nube', 'assets/nube.png');
        this.load.image('bomb', 'assets/bomb.png');
    }

    crearEstrellasVida() {
        this.estrellasVidas.forEach(estrella => estrella.destroy());
        this.estrellasVidas = [];
        
        // Crear estrellas como en la imagen de referencia
        for (let i = 0; i < 3; i++) {
            const estrella = this.add.image(130 + (i * 30), 25, 'star').setScale(0.4);
            if (i >= this.vidas) {
                estrella.setAlpha(0.3); // Estrellas perdidas más transparentes
            }
            this.estrellasVidas.push(estrella);
        }
        
        // Texto "INTENTOS:" como en la imagen
        if (this.textoIntentos) this.textoIntentos.destroy();
        this.textoIntentos = this.add.text(16, 16, 'INTENTOS:', { 
            fontSize: '20px', 
            fill: '#000',
            fontWeight: 'bold'
        });
    }

    crearPlataformasYBombas() {
        // Limpiar plataformas y bombas existentes
        this.plataformas.forEach(plat => plat.destroy());
        this.bombas.forEach(bomb => bomb.destroy());
        this.plataformas = [];
        this.bombas = [];
        
        // Asegurarse de que el jugador esté definido antes de crear colisiones
        if (!this.player) return; 

        // Crear plataformas escalonadas para llegar a la meta (como en la imagen)
        const plataforma1 = this.physics.add.staticImage(520, 350, 'ground').setScale(0.6).refreshBody();
        const plataforma2 = this.physics.add.staticImage(620, 280, 'ground').setScale(0.6).refreshBody();
        const plataforma3 = this.physics.add.staticImage(720, 210, 'ground').setScale(0.6).refreshBody();
        
        this.plataformas.push(plataforma1, plataforma2, plataforma3);
        
        // Agregar bombas en las plataformas
        const bomba1 = this.physics.add.staticImage(520, 320, 'bomb');
        const bomba2 = this.physics.add.staticImage(620, 250, 'bomb');
        
        this.bombas.push(bomba1, bomba2);
        
        // Colisiones con plataformas
        this.plataformas.forEach(plataforma => {
            if (this.player && this.physics) {
                this.physics.add.collider(this.player, plataforma);
            }
        });
        
        // Colisiones con bombas
        this.bombas.forEach(bomba => {
            if (this.player && this.physics) {
                this.physics.add.collider(this.player, bomba, (player, bombObject) => {
                    if (!player.active || !bombObject.active) return; // Añadir comprobación de existencia
                    bombObject.destroy();
                    this.perderVida();
                }, null, this);
            }
        });
    }

    perderVida() {
        if (this.gameOver || this.gameWon) return;
        
        this.vidas--;
        this.crearEstrellasVida();
        
        // Efecto visual
        this.cameras.main.shake(200, 0.01);
        this.player.setTint(0xff0000);
        this.time.delayedCall(200, () => this.player.clearTint());
        
        if (this.vidas <= 0) {
            this.mostrarGameOver();
        } else {
            // Reiniciar posición del jugador
            this.player.setPosition(100, 450);
            this.crearPlataformasYBombas();
        }
    }

    mostrarGameOver() {
         this.gameOver = true;
    
    // Crear overlay con Graphics (más robusto)
        const overlay = this.add.graphics();
          overlay.fillStyle(0xB8D62F, 0.95);
        overlay.fillRect(
            0,      // x (relativo a la posición del graphics)
            0,      // y
            800,    // width
            400     // height
         );
          // Borde del rectángulo
        overlay.lineStyle(4, 0x000000);
        overlay.strokeRect(0, 0, 800, 400);
         
        // Posicionamiento centrado
        overlay.setPosition(400 - 800/2, 300 - 400/2);
        // Asegurar que esté por encima
        
        // Texto "PERDISTE" en rojo
        this.add.text(400, 200, 'PERDISTE', { 
            fontSize: '48px', 
            fill: '#ff0000',
            fontWeight: 'bold'
        }).setOrigin(0.5);
        
        // Mostrar operador actual en lugar de "NIVEL FÁCIL"
        let operadorTexto = '';
        switch(this.operadorActual) {
            case 'menor': operadorTexto = 'MENOR QUE <'; break;
            case 'mayor': operadorTexto = 'MAYOR QUE >'; break;
            case 'igual': operadorTexto = 'IGUAL ='; break;
        }
        
        this.add.text(150, 280, 'INTENTOS:', { 
            fontSize: '16px', 
            fill: '#000'
        });
        
        this.add.text(280, 280, operadorTexto, { 
            fontSize: '16px', 
            fill: '#000',
            fontWeight: 'bold'
        });
        
        // Botón REINTENTAR con flecha verde
        const botonReinicio = this.add.text(500, 320, 'REINTENTAR ▶', { 
            fontSize: '24px', 
            fill: '#000',
            fontWeight: 'bold'
        }).setInteractive();
        
        botonReinicio.on('pointerdown', () => {
            this.reiniciarJuego();
        });
        
        // Deshabilitar controles
        this.player.setVelocity(0, 0);
    }

    mostrarPantallaGanaste() {
        this.gameWon = true;
        
        // Crear overlay como en la imagen de referencia
        // Crear overlay con Graphics
        const overlay = this.add.graphics();
        
        // Relleno del rectángulo
        overlay.fillStyle(0xB8D62F, 0.95);
        overlay.fillRect(0, 0, 800, 400);
        
        // Borde del rectángulo
        overlay.lineStyle(4, 0x000000);
        overlay.strokeRect(0, 0, 800, 400);
        
        // Posicionamiento centrado
        overlay.setPosition(400 - 800/2, 300 - 400/2);
       // overlay.setDepth(1000);
        
        // Texto "GANASTE" en amarillo/dorado
        this.add.text(400, 200, 'GANASTE', { 
            fontSize: '48px', 
            fill: '#FFD700',
            fontWeight: 'bold'
        }).setOrigin(0.5);
        
        // Mostrar operador actual
        let operadorTexto = '';
        switch(this.operadorActual) {
            case 'menor': operadorTexto = 'MENOR QUE <'; break;
            case 'mayor': operadorTexto = 'MAYOR QUE >'; break;
            case 'igual': operadorTexto = 'IGUAL ='; break;
        }
        
        this.add.text(150, 280, 'INTENTOS:', { 
            fontSize: '16px', 
            fill: '#000'
        });
        
        this.add.text(280, 280, operadorTexto, { 
            fontSize: '16px', 
            fill: '#000',
            fontWeight: 'bold'
        });
        
        // Botón SIGUIENTE NIVEL con flecha verde
        const botonSiguiente = this.add.text(500, 320, 'SIGUIENTE NIVEL ▶', { 
            fontSize: '24px', 
            fill: '#000',
            fontWeight: 'bold'
        }).setInteractive();
        
        botonSiguiente.on('pointerdown', () => {
            this.siguienteOperador();
        });
        
        // Deshabilitar controles
        this.player.setVelocity(0, 0);
    }

    siguienteOperador() {
        this.operadorIndex = (this.operadorIndex + 1) % this.operadores.length;
        this.operadorActual = this.operadores[this.operadorIndex];
        this.reiniciarJuego();
    }

    reiniciarJuego() {
        this.vidas = 3;
        this.gameOver = false;
        this.gameWon = false;
        this.scene.restart();
    }

    create() {
        // Fondo
        this.add.image(400, 300, 'sky');
        
        // Crear nubes como en la imagen de referencia
        this.nubes = this.add.group();
        const posicionesNubes = [
            {x: 150, y: 100}, {x: 350, y: 80}, {x: 550, y: 120}, {x: 700, y: 90}
        ];
        
        posicionesNubes.forEach(pos => {
            const nube = this.add.image(pos.x, pos.y, 'nube').setScale(0.8).setAlpha(0.9);
            this.nubes.add(nube);
        });
        
        // Vidas
        this.crearEstrellasVida();

        // Plataforma base
        this.platform = this.physics.add.staticImage(400, 568, 'ground').setScale(2).refreshBody();
        
        // Plataformas escalonadas y bombas
        this.crearPlataformasYBombas();

        // Bandera (meta) en la esquina superior derecha como en la imagen
        this.win = this.physics.add.staticImage(750, 150, 'win').setScale(0.8);
        
        // Escalera
        this.escalera = this.physics.add.staticImage(320, 486, 'escalera');
        this.escalera.body.setSize(20, 102);
        this.escalera.body.setOffset(20, 0);

        // Jugador
        this.player = this.physics.add.sprite(100, 450, 'dude');
        this.player.setCollideWorldBounds(true);
        this.player.setBounce(0.2);

        // Plataformas escalonadas y bombas (llamada después de inicializar this.player)
        this.crearPlataformasYBombas();

        // Colisiones básicas
        this.physics.add.collider(this.player, this.win, () => {
            if (!this.gameOver && !this.gameWon) {
                this.mostrarPantallaGanaste();
            }
        });
        
        this.physics.add.collider(this.player, this.platform);

        // Generar números aleatorios para los cuadrados
        this.numeros = [];
        for (let i = 0; i < 5; i++) {
            this.numeros.push(Phaser.Math.Between(1, 20));
        }

        // Para el operador "igual", asegurar que haya al menos un número repetido
        if (this.operadorActual === 'igual') {
            const numeroRepetido = Phaser.Math.Between(1, 20);
            this.numeros[0] = numeroRepetido;
            this.numeros[1] = numeroRepetido; // Asegurar que hay al menos dos números iguales
        }

        // Mostrar el objetivo del juego según el operador
        let objetivoTexto = '';
        let numeroObjetivo = '';
        
        switch(this.operadorActual) {
            case 'menor':
                numeroObjetivo = Math.min(...this.numeros);
                objetivoTexto = `Encuentra el número MENOR: ${numeroObjetivo}`;
                break;
            case 'mayor':
                numeroObjetivo = Math.max(...this.numeros);
                objetivoTexto = `Encuentra el número MAYOR: ${numeroObjetivo}`;
                break;
            case 'igual':
                // Encontrar números repetidos
                const repetidos = this.numeros.filter(n => this.numeros.indexOf(n) !== this.numeros.lastIndexOf(n));
                const numerosUnicos = [...new Set(repetidos)];
                if (numerosUnicos.length > 0) {
                    objetivoTexto = `Encuentra números IGUALES: ${numerosUnicos.join(', ')}`;
                } else {
                    objetivoTexto = 'Encuentra números IGUALES';
                }
                break;
        }
        
        // Mostrar el tipo de juego actual y el objetivo
        let tipoJuegoTexto = '';
        switch(this.operadorActual) {
            case 'menor': tipoJuegoTexto = 'JUEGO: MENOR QUE (<)'; break;
            case 'mayor': tipoJuegoTexto = 'JUEGO: MAYOR QUE (>)'; break;
            case 'igual': tipoJuegoTexto = 'JUEGO: IGUAL A (=)'; break;
        }
        
        // Texto del tipo de juego en la parte superior
        this.add.text(400, 50, tipoJuegoTexto, {
            fontSize: '24px',
            fill: '#000',
            fontWeight: 'bold',
            backgroundColor: '#FFD700',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);
        
        // Texto del objetivo en la parte superior
        this.add.text(400, 80, objetivoTexto, {
            fontSize: '18px',
            fill: '#000',
            fontWeight: 'bold',
            backgroundColor: '#87CEEB',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5);

        // Cuadrados con números como en la imagen
        this.cuadrados = this.physics.add.staticGroup();
        this.textoNumeros = [];
        this.cuadradoNumero = new Map();
        
        for (let i = 0; i < 5; i++) {
            const cuadrado = this.physics.add.staticImage(50 + (i * 60), 384, 'cuadrado').setScale(0.8);
            cuadrado.setTint(0x4169E1); // Azul como en la imagen
            this.cuadrados.add(cuadrado);
            
            const numero = this.numeros[i];
            const texto = this.add.text(cuadrado.x, cuadrado.y, numero, {
                fontSize: '20px',
                fill: '#fff',
                fontWeight: 'bold'
            }).setOrigin(0.5);
            
            this.textoNumeros.push(texto);
            this.cuadradoNumero.set(cuadrado, numero);
        }

        // Colisión con cuadrados según el operador actual
        this.physics.add.collider(this.player, this.cuadrados, (player, cuadrado) => {
            if (this.gameOver || this.gameWon) return;
            
            const numeroSeleccionado = this.cuadradoNumero.get(cuadrado);
            let esCorrecta = false;
            
            switch(this.operadorActual) {
                case 'menor':
                    esCorrecta = numeroSeleccionado === Math.min(...this.numeros);
                    break;
                case 'mayor':
                    esCorrecta = numeroSeleccionado === Math.max(...this.numeros);
                    break;
                case 'igual':
                    // Para igual, buscar si hay números repetidos
                    const repetidos = this.numeros.filter(n => this.numeros.indexOf(n) !== this.numeros.lastIndexOf(n));
                    esCorrecta = repetidos.includes(numeroSeleccionado);
                    break;
            }
            
            if (esCorrecta) {
                // Hacer desaparecer el obstáculo
                if (this.obstaculo && this.obstaculo.active) {
                    this.obstaculo.disableBody(true, true); // Desactivar y ocultar
                    this.obstaculo = null; // Eliminar la referencia
                }
                // Eliminar cuadrado seleccionado y su texto
                cuadrado.disableBody(true, true); // Desactivar y ocultar el cuerpo de física
                this.time.delayedCall(0, () => {
                    this.cuadrados.remove(cuadrado); // Eliminar del grupo
                    cuadrado.destroy();
                    
                    // Eliminar el texto asociado al cuadrado
                    this.textoNumeros = this.textoNumeros.filter(texto => {
                        if (texto.x === cuadrado.x && texto.y === cuadrado.y) {
                            texto.destroy();
                            return false;
                        }
                        return true;
                    });
                    this.cuadradoNumero.delete(cuadrado);
                });
                
                // Efecto visual positivo
                this.player.setTint(0x00ff00);
                this.time.delayedCall(200, () => this.player.clearTint());
            } else {
                this.perderVida();
            }
        });

        // Obstáculo que bloquea el paso
        this.obstaculo = this.physics.add.staticImage(300, 486, 'obstaculo').setScale(0.4).refreshBody();
        this.physics.add.collider(this.player, this.obstaculo);

        // Animaciones del personaje
        this.anims.create({
            key: "right",
            frames: this.anims.generateFrameNumbers("dude", { start: 0, end: 2 }),
            frameRate: 10,
            repeat: -1,
        });

        this.anims.create({
            key: "left",
            frames: this.anims.generateFrameNumbers("dude", { start: 0, end: 2 }),
            frameRate: 10,
            repeat: -1,
        });

        this.anims.create({
            key: "turn",
            frames: [{ key: "dude", frame: 1 }], // Usar un frame existente, por ejemplo el 1
            frameRate: 20,
        });

        // Escalera
        this.subeEscalera = false;
        this.physics.add.overlap(this.player, this.escalera, () => {
            this.subeEscalera = true;
        }, null, this);

        // Controles
        this.cursors = this.input.keyboard.createCursorKeys();
    }

    update() {
        if (this.gameOver || this.gameWon) return;
        
        // Mover nubes suavemente
        this.nubes.getChildren().forEach(nube => {
            nube.x -= 0.2;
            if (nube.x < -100) {
                nube.x = 900;
            }
        });

        // Movimiento del jugador
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-160);
            this.player.anims.play('left', true);
        }
        else if (this.cursors.right.isDown) {
            this.player.setVelocityX(160);
            this.player.anims.play('right', true);
        }
        else {
            this.player.setVelocityX(0);
            this.player.anims.play('turn', true);
        }

        if (this.cursors.up.isDown && this.player.body.touching.down && !this.subeEscalera) {
            this.player.setVelocityY(-240);
        }

        if (this.subeEscalera && this.cursors.up.isDown) {
            this.player.setVelocityY(-245);
        }
        
        this.subeEscalera = false;
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    parent: 'game',
    scene: GameScene
};

const game = new Phaser.Game(config);

