'use strict';

class TextLabel extends Actor {
    constructor(x, y, text) {
        const hitArea = new Rectangle(0, 0, 0, 0);
        super(x, y, hitArea);
        
        this.text = text;
    }

    render(target) {
        const context = target.getContext('2d');
        context.font = '25px sans-serif';
        context.fillStyle = 'white';
        context.fillText(this.text, this.x, this.y);
    }
}

class TextLabelMini extends Actor {
    constructor(x, y, text) {
        const hitArea = new Rectangle(0, 0, 0, 0);
        super(x, y, hitArea);
        
        this.text = text;
    }

    render(target) {
        const context = target.getContext('2d');
        context.font = '10px sans-serif';
        context.fillStyle = 'white';
        context.fillText(this.text, this.x, this.y);
    }
}

class Bullet extends SpriteActor {
    constructor(x, y) {
        const sprite = new Sprite(assets.get('sprite'), new Rectangle(0, 16, 16, 16));
        const hitArea = new Rectangle(4, 0, 8, 16);
        super(x, y, sprite, hitArea, ['playerBullet']);

        this._speed = 6;

        // 敵に当たったら消える
        this.addEventListener('hit', (e) => {
           if(e.target.hasTag('enemy')) { this.destroy(); } 
        });
    }

    update(gameInfo, input) {
        this.y -= this._speed;
        if(this.isOutOfBounds(gameInfo.screenRectangle)) {
            this.destroy();
        }
    }
}

class Fighter extends SpriteActor {
    constructor(x, y) {
        const sprite = new Sprite(assets.get('sprite'), new Rectangle(0, 0, 16, 16));
        const hitArea = new Rectangle(8, 8, 2, 2);
        super(x, y, sprite, hitArea);

        this._interval = 5;
        this._timeCount = 0;
        this._speed = 3;
        this._velocityX = 0;
        this._velocityY = 0;
        
        // 敵の弾に当たったらdestroyする
        this.addEventListener('hit', (e) => {
           if(e.target.hasTag('enemyBullet')) {
               this.destroy();
           } 
        });
    }
    
    update(gameInfo, input) {
        // キーを押されたら移動する
        this._velocityX = 0;
        this._velocityY = 0;

        if(input.getKey('ArrowUp')) { this._velocityY = -this._speed; }
        if(input.getKey('ArrowDown')) { this._velocityY = this._speed; }
        if(input.getKey('ArrowRight')) { this._velocityX = this._speed; }
        if(input.getKey('ArrowLeft')) { this._velocityX = -this._speed; }
        
        this.x += this._velocityX;
        this.y += this._velocityY;

        // 画面外に行ってしまったら押し戻す
        const boundWidth = gameInfo.screenRectangle.width - this.width;
        const boundHeight = gameInfo.screenRectangle.height - this.height;
        const bound = new Rectangle(this.width, this.height, boundWidth, boundHeight);
        
        if(this.isOutOfBounds(bound)) {
            this.x -= this._velocityX;
            this.y -= this._velocityY;
        }

        // スペースキーで弾を打つ
        this._timeCount++;
        const isFireReady = this._timeCount > this._interval;
        if(isFireReady && input.getKey(' ')) {
            const bullet = new Bullet(this.x, this.y);
            this.spawnActor(bullet);
            this._timeCount = 0;
        }
    }
}

class EnemyBullet extends SpriteActor {
    constructor(x, y, velocityX, velocityY) {
        const sprite = new Sprite(assets.get('sprite'), new Rectangle(16, 16, 16, 16));
        const hitArea = new Rectangle(4, 4, 8, 8);
        super(x, y, sprite, hitArea, ['enemyBullet']);

        this.velocityX = velocityX;
        this.velocityY = velocityY;
    }

    update(gameInfo, input) {
        this.x += this.velocityX;
        this.y += this.velocityY;

        if(this.isOutOfBounds(gameInfo.screenRectangle)) {
            this.destroy();
        }
    }
}

class Enemy1 extends SpriteActor {
    constructor(x, y) {
        const sprite = new Sprite(assets.get('sprite'), new Rectangle(16, 0, 16, 16));
        const hitArea = new Rectangle(0, 0, 16, 16);
        super(x, y, sprite, hitArea, ['enemy']);

        this.maxHp = 50;
        this.currentHp = this.maxHp;

        this._interval = 120;
        this._timeCount = 0;
        this._velocityX = 0.3;

        // プレイヤーの弾に当たったらHPを減らす
        this.addEventListener('hit', (e) => {
           if(e.target.hasTag('playerBullet')) {
               this.currentHp--;
               this.dispatchEvent('changehp', new GameEvent(this));
           }
        });
    }

    // degree度の方向にspeedの速さで弾を発射する
    shootBullet(degree, speed) {
        const rad = degree / 180 * Math.PI;
        const velocityX = Math.cos(rad) * speed;
        const velocityY = Math.sin(rad) * speed;
        
        const bullet = new EnemyBullet(this.x, this.y, velocityX, velocityY);
        this.spawnActor(bullet);
    }

    // num個の弾を円形に発射する
    shootCircularBullets(num, speed) {
        const degree = 360 / num;
        for(let i = 0; i < num; i++) {
            this.shootBullet(degree * i, speed);
        }
    }

    update(gameInfo, input) {
        // 左右に移動する
        this.x += this._velocityX;
        if(this.x <= 100 || this.x >= 200) { this._velocityX *= -1; }
        
        // インターバルを経過していたら弾を撃つ
        this._timeCount++;
        if(this._timeCount > this._interval) {
            this.shootCircularBullets(15, 1);
            this._timeCount = 0;
        }

        // HPがゼロになったらdestroyする
        if(this.currentHp <= 0) {
            this.destroy();
        }
    }
}

class Enemy2 extends SpriteActor {
    constructor(x, y) {
        const sprite = new Sprite(assets.get('sprite'), new Rectangle(16, 0, 16, 16));
        const hitArea = new Rectangle(0, 0, 16, 16);
        super(x, y, sprite, hitArea, ['enemy']);

        this.maxHp = 50;
        this.currentHp = this.maxHp;

        this._interval = 10;
        this._timeCount = 0;
        this._count = 0;

        // プレイヤーの弾に当たったらHPを減らす
        this.addEventListener('hit', (e) => {
           if(e.target.hasTag('playerBullet')) {
               this.currentHp--;
               this.dispatchEvent('changehp', new GameEvent(this));
           }
        });
    }

    // degree度の方向にspeedの速さで弾を発射する
    shootBullet(degree, speed) {
        const rad = degree / 180 * Math.PI;
        const velocityX = Math.cos(rad) * speed;
        const velocityY = Math.sin(rad) * speed;
        
        const bullet = new EnemyBullet(this.x, this.y, velocityX, velocityY);
        this.spawnActor(bullet);
    }

    // num個の弾を円形に発射する
    shootCircularBullets(num, speed, initialDegree) {
        const degree = 360 / num;
        for(let i = 0; i < num; i++) {
            this.shootBullet(initialDegree + degree * i, speed);
        }
    }

    update(gameInfo, input) {
        // インターバルを経過していたら弾を撃つ
        this._timeCount++;
        if(this._timeCount > this._interval) {
            this._count += 10;
            this.shootCircularBullets(10, 1, this._count);
            this._timeCount = 0;
        }

        // HPがゼロになったらdestroyする
        if(this.currentHp <= 0) {
            this.destroy();
        }
    }
}

class EnemyHpBar extends Actor {
    constructor(x, y, enemy) {
        const hitArea = new Rectangle(0, 0, 0, 0);
        super(x, y, hitArea);

        this._width = 200;
        this._height = 10;
        
        this._innerWidth = this._width;

        // 敵のHPが変わったら内側の長さを変更する
        enemy.addEventListener('changehp', (e) => {
            const maxHp = e.target.maxHp;
            const hp = e.target.currentHp;
            this._innerWidth = this._width * (hp / maxHp);
        });
    }

    render(target) {
        const context = target.getContext('2d');
        context.strokeStyle = 'white';
        context.fillStyle = 'white';
        
        context.strokeRect(this.x, this.y, this._width, this._height);
        context.fillRect(this.x, this.y, this._innerWidth, this._height);
    }
}

class DanmakuStgEndScene extends Scene {
    constructor(renderingTarget) {
        super('クリア', 'black', renderingTarget);
        const text = new TextLabel(60, 200, 'ゲームクリア！');
        const inst2 = new TextLabelMini(80, 350, 'PRESS SPACE KEY TO TITLE');
        this.add(text);
        this.add(inst2);
    }
    
    update(gameInfo, input) {
        super.update(gameInfo, input);
        if(input.getKeyDown(' ')) {
            const mainScene1 = new DanmakuStgTitleScene(this.renderingTarget);
            this.changeScene(mainScene1);
        }
    }
}

class DanmakuStgGameOverScene extends Scene {
    constructor(renderingTarget) {
        super('ゲームオーバー', 'black', renderingTarget);
        const text = new TextLabel(50, 200, 'ゲームオーバー…');
        const inst2 = new TextLabelMini(80, 350, 'PRESS SPACE KEY TO TITLE');
        this.add(text);
        this.add(inst2);
    }

    update(gameInfo, input) {
        super.update(gameInfo, input);
        if(input.getKeyDown(' ')) {
            const mainScene1 = new DanmakuStgTitleScene(this.renderingTarget);
            this.changeScene(mainScene1);
        }
    }
}

class DanmakuStgMainScene2 extends Scene {
    constructor(renderingTarget) {
        super('メイン', 'black', renderingTarget);
        const title = new TextLabelMini(10, 10, '２面');
        const fighter = new Fighter(150, 300);
        const enemy = new Enemy2(150, 100);
        const hpBar = new EnemyHpBar(50, 20, enemy);
        this.add(title);
        this.add(fighter);
        this.add(enemy);
        this.add(hpBar);
        
        // 自機がやられたらゲームオーバー画面にする
        fighter.addEventListener('destroy', (e) => {
            const scene = new DanmakuStgGameOverScene(this.renderingTarget);
            this.changeScene(scene);
        });

        // 敵がやられたらクリア画面にする
        enemy.addEventListener('destroy', (e) => {
            const scene = new DanmakuStgEndScene(this.renderingTarget);
            this.changeScene(scene);
        });
    }
}

class DanmakuStgMainScene1 extends Scene {
    constructor(renderingTarget) {
        super('メイン', 'black', renderingTarget);
        const title = new TextLabelMini(10, 10, '１面');
        const fighter = new Fighter(150, 300);
        const enemy = new Enemy1(150, 100);
        const hpBar = new EnemyHpBar(50, 20, enemy);
        this.add(title);
        this.add(fighter);
        this.add(enemy);
        this.add(hpBar);
        
        // 自機がやられたらゲームオーバー画面にする
        fighter.addEventListener('destroy', (e) => {
            const scene = new DanmakuStgGameOverScene(this.renderingTarget);
            this.changeScene(scene);
        });

        // 敵がやられたら２画にする
        enemy.addEventListener('destroy', (e) => {
            const mainScene2 = new DanmakuStgMainScene2(this.renderingTarget);
            this.changeScene(mainScene2);
        });
    }
}

class DanmakuStgTitleScene extends Scene {
    constructor(renderingTarget) {
        super('タイトル', 'black', renderingTarget);
        const title = new TextLabel(100, 200, '弾幕STG');
        const inst1 = new TextLabelMini(70, 250, '方向キーで移動、SPACEキーで攻撃');
        const inst2 = new TextLabelMini(105, 350, 'PRESS SPACE KEY');
        this.add(title);
        this.add(inst1);
        this.add(inst2);
    }

    update(gameInfo, input) {
        super.update(gameInfo, input);
        if(input.getKeyDown(' ')) {
            //const mainScene = new DanmakuStgMainScene(this.renderingTarget);
            //this.changeScene(mainScene);
            const mainScene1 = new DanmakuStgMainScene1(this.renderingTarget);
            this.changeScene(mainScene1);
        }
    }
}

class DanamkuStgGame extends Game {
    constructor() {
        super('弾幕STG', 300, 400, 60);
        const titleScene = new DanmakuStgTitleScene(this.screenCanvas);
        this.changeScene(titleScene);
    }
}

assets.addImage('sprite', 'sprite.png');
assets.loadAll().then((a) => {
    const game = new DanamkuStgGame();
    document.body.appendChild(game.screenCanvas);
    game.start();
});