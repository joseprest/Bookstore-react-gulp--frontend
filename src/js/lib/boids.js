import EventEmitter from 'wolfy87-eventemitter';

const { sqrt } = Math;

export default class Boids extends EventEmitter {
    static getDistanceBetweenPoints(x1, y1, x2, y2) {
        const dx = x1 - x2;
        const dy = y1 - y2;
        return sqrt(dx * dx + dy * dy);
    }

    constructor(opts = {}, callback = () => {}) {
        super();

        this.attractors = opts.attractors || [];
        this.repulsors = opts.repulsors || [];
        this.width = opts.width || 0;
        this.height = opts.height || 0;
        this.radiusMargin = opts.radiusMargin || 10;
        this.globalSpeed = opts.globalSpeed || 0.09;
        this.repulsionFactor = opts.repulsionFactor || 0;
        this.steerAwayFromNeighboursFactor = opts.steerAwayFromNeighboursFactor || 0.001;
        this.steerTowardsActtractorsFactor = opts.steerTowardsActtractorsFactor || 0.0009;
        this.currentGroupAttractionFactor = opts.currentGroupAttractionFactor || 2;
        this.matchVelocityFactor = 0; // opts.matchVelocityFactor || 0.00125
        this.stageMarginX = typeof opts.stageMarginX !== 'undefined' ? opts.stageMarginX : 0;
        this.stageMarginY = typeof opts.stageMarginY !== 'undefined' ? opts.stageMarginY : 0;
        this.birthX = 0;
        this.birthY = -Math.PI / 2;

        this.updateBoids(opts.boids);

        this.on('tick', () => {
            callback(this.boids);
        });
    }

    updateBoids(boids) {
        const newBoids = [];
        for (let i = 0, il = boids.length - 1; i < il; i += 1) {
            const boid = boids[i];
            newBoids[i] = {
                id: boid.id,
                current: boid.current,
                radius: boid.radius,
                outerRadius: boid.radius + this.radiusMargin,
                x: boid.x + Math.sin(this.birthX) * boid.initialDistance,
                y: boid.y + Math.sin(this.birthY) * boid.initialDistance,
                velocity: {
                    x: 0, // typeof boid.initialVelocityX !== 'undefined' ? boid.initialVelocityX*this.startingVelocity:Math.sin(this.birthX),
                    y: 0, // typeof boid.initialVelocityY !== 'undefined' ? boid.initialVelocityY*this.startingVelocity:Math.sin(this.birthY)
                },
                oldVelocity: {
                    x: 0,
                    y: 0,
                },
                attractionFactor:
                    typeof boid.attractionFactor === 'undefined' ? 1 : boid.attractionFactor,
                speed: 0.85 + 0.05 * Math.random(),
            };
            this.birthX += (Math.PI * 2) / 7.2;
            this.birthY += (Math.PI * 2) / 7.2;
        }
        this.boids = newBoids;
        this.boidsLength = newBoids.length;
    }

    tick() {
        const maxX = this.width;
        const maxY = this.height;

        const mb = this.boidsLength;
        // const pl = this.attractors.length;
        for (let j = 0; j < mb; j += 1) {
            const b = this.boids[j];

            if (b.current) {
                continue;
            }

            const neighbours = [];

            b.collidingCurrent = false;

            for (let k = 0; k < mb; k++) {
                const b2 = this.boids[k];
                if (b != b2) {
                    const distance = Boids.getDistanceBetweenPoints(b.x, b.y, b2.x, b2.y);
                    const minDistance = b.outerRadius + b2.outerRadius;
                    if (distance < minDistance && b.c === b2.c) {
                        if (b2.current) {
                            b.collidingCurrent = true;
                        }
                        neighbours.push(b2);
                    }
                }
            }

            if (b.collidingCurrent) {
                // b.attractionFactor = 1;
            }

            const v1 = this.repulseFromRepulsors(b);
            const v2 = this.steerTowardsAttractors(b);
            const v3 = this.steerAwayFromNeighbours(b, neighbours);
            const v4 = this.matchVelocity(b, neighbours);

            // console.log(v1,v2,v3,v4);

            b.velocity.x += v1.x + v2.x + v3.x + v4.x;
            b.velocity.y += v1.y + v2.y + v3.y + v4.y;

            let l = sqrt(b.velocity.x * b.velocity.x + b.velocity.y * b.velocity.y);
            const norm = 1 / l;
            l = Math.min(Math.max(l, 2), 80);

            const { speed } = b;

            b.velocity.x *= speed * l * norm;
            b.velocity.y *= speed * l * norm;

            b.x += b.velocity.x * this.globalSpeed;
            b.y += b.velocity.y * this.globalSpeed;

            // out of bounds
            if (
                this.stageMarginX !== null
                && (b.x <= -this.stageMarginX + b.outerRadius
                    || b.x >= maxX - b.outerRadius + this.stageMarginX)
            ) {
                b.velocity.x *= -1;
                b.x = b.x <= -this.stageMarginX + b.outerRadius
                    ? -this.stageMarginX + b.outerRadius
                    : maxX - b.outerRadius + this.stageMarginX;
            }
            if (
                this.stageMarginY !== null
                && (b.y <= -this.stageMarginY + b.outerRadius
                    || b.y >= maxY - b.outerRadius + this.stageMarginY)
            ) {
                b.velocity.y *= -1;
                b.y = b.y <= -this.stageMarginY + b.outerRadius
                    ? -this.stageMarginY + b.outerRadius
                    : maxY - b.outerRadius + this.stageMarginY;
            }
            b.oldVelocity.x = b.velocity.x;
            b.oldVelocity.y = b.velocity.y;
        }

        this.emit('tick', this.boids);
    }

    steerTowardsAttractors(b) {
        let x = 0;
        let y = 0;
        for (let j = 0, pl = this.attractors.length; j < pl; j += 1) {
            const p = this.attractors[j];
            // var distance = Boids.getDistanceBetweenPoints(b.x, b.y, p.x, p.y);
            // distance -= b.outerRadius;
            // var attractionRatio = distance;
            let attractionRatio = b.attractionFactor;
            if (false && 'isCurrentGroup') {
                // tmp
                attractionRatio *= this.currentGroupAttractionFactor;
            }
            x += attractionRatio * this.steerTowardsActtractorsFactor * (p.x - b.x);
            y += attractionRatio * this.steerTowardsActtractorsFactor * (p.y - b.y);
        }
        return {
            x,
            y,
        };
    }

    steerAwayFromNeighbours(b, neighbours) {
        const neighboursLength = neighbours.length;
        if (neighboursLength === 0) return { x: 0, y: 0, z: 0 };

        const v = { x: 0, y: 0, z: 0 };

        for (let k = 0, m = neighboursLength; k < m; k += 1) {
            const b2 = neighbours[k];

            const dx = b2.x - b.x;
            const dy = b2.y - b.y;
            const distance = sqrt(dx * dx + dy * dy);

            const minDistance = b2.outerRadius + b.outerRadius;
            if (distance < minDistance) {
                let diff = minDistance - distance;
                diff *= this.steerAwayFromNeighboursFactor;
                v.x -= diff * dx;
                v.y -= diff * dy;
            }
        }

        return v;
    }

    matchVelocity(b, neighbours) {
        const v = { x: 0, y: 0, z: 0 };

        const nl = neighbours.length;

        if (nl) {
            for (let k = 0, m = nl; k < m; k += 1) {
                const b2 = neighbours[k];
                v.x += b2.velocity.x;
                v.y += b2.velocity.y;
            }

            v.x /= nl;
            v.y /= nl;
        }

        return {
            x: this.matchVelocityFactor * (v.x - b.velocity.x),
            y: this.matchVelocityFactor * (v.y - b.velocity.y),
        };
    }

    repulseFromRepulsors(b) {
        const v = { x: 0, y: 0 };

        for (let j = 0, pl = this.repulsors.length; j < pl; j += 1) {
            const b2 = this.repulsors[j];
            b2.outerRadius = typeof b2.outerRadius !== 'undefined' ? b2.outerRadius : 0;
            const distance = Boids.getDistanceBetweenPoints(b.x, b.y, b2.x, b2.y);
            const minDistance = b.outerRadius + b2.outerRadius;
            if (distance < minDistance) {
                v.x += b2.x > b.x ? -1 : 1 * this.repulsionFactor * (minDistance - distance);
                v.y += b2.y > b.y ? -1 : 1 * this.repulsionFactor * (minDistance - distance);
            }
        }
        return v;
    }
}
