// Earcut三角形分割ライブラリの実装

export function earcut(data, holeIndices, dim) {
    dim = dim || 2;
    const hasHoles = holeIndices && holeIndices.length;
    const outerlen = hasHoles ? holeIndices[0] * dim : data.length;
    let outerNode = linkedList(data, 0, outerlen, dim, true);
    const triangles = [];

    if (!outerNode || outerNode.next === outerNode.prev) return triangles;

    let minX, minY, maxX, maxY, x, y, invSize;

    if (hasHoles) outerNode = eliminateHoles(data, holeIndices, outerNode, dim);

    if (data.length > 80 * dim) {
        minX = maxX = data[0];
        minY = maxY = data[1];

        for (let i = dim; i < outerlen; i += dim) {
            x = data[i];
            y = data[i + 1];
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
        }

        invSize = Math.max(maxX - minX, maxY - minY);
        invSize = invSize !== 0 ? 1 / invSize : 0;
    }

    earcutLinked(outerNode, triangles, dim, minX, minY, invSize);

    return triangles;
}

function linkedList(data, start, end, dim, clockwise) {
    let last;

    if (clockwise === (signedArea(data, start, end, dim) > 0)) {
        for (let i = start; i < end; i += dim) last = insertNode(i, data[i], data[i + 1], last);
    } else {
        for (let i = end - dim; i >= start; i -= dim) last = insertNode(i, data[i], data[i + 1], last);
    }

    if (last && equals(last, last.next)) {
        removeNode(last);
        last = last.next;
    }

    if (last) {
        last.next.prev = last;
        last.prev.next = last;
    }

    return last;
}

function filterPoints(start, end) {
    if (!start) return start;
    if (!end) end = start;

    let p = start;
    let again = true;

    while (again || p !== end) {
        again = false;

        if (!p.steiner && (equals(p, p.next) || area(p.prev, p, p.next) === 0)) {
            removeNode(p);
            p = end = p.prev;
            if (p === p.next) break;
            again = true;
        } else {
            p = p.next;
        }
    }

    return end;
}

function earcutLinked(ear, triangles, dim, minX, minY, invSize, pass) {
    if (!ear) return;

    if (!pass && invSize) indexCurve(ear, minX, minY, invSize);

    let stop = ear;
    let prev, next;

    while (ear.prev !== ear.next) {
        prev = ear.prev;
        next = ear.next;

        if (invSize ? isEarHashed(ear, minX, minY, invSize) : isEar(ear)) {
            triangles.push(prev.i / dim);
            triangles.push(ear.i / dim);
            triangles.push(next.i / dim);

            removeNode(ear);

            ear = next.next;
            stop = next.next;

            continue;
        }

        ear = next;

        if (ear === stop) {
            if (!pass) {
                earcutLinked(filterPoints(ear), triangles, dim, minX, minY, invSize, 1);
            } else if (pass === 1) {
                ear = cureLocalIntersections(filterPoints(ear), triangles, dim);
                earcutLinked(ear, triangles, dim, minX, minY, invSize, 2);
            } else if (pass === 2) {
                splitEarcut(ear, triangles, dim, minX, minY, invSize);
            }

            break;
        }
    }
}

function isEar(ear) {
    const a = ear.prev;
    const b = ear;
    const c = ear.next;

    if (area(a, b, c) >= 0) return false;

    let p = ear.next.next;

    while (p !== ear.prev) {
        if (pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, p.x, p.y) &&
            area(p.prev, p, p.next) >= 0) return false;
        p = p.next;
    }

    return true;
}

function isEarHashed(ear, minX, minY, invSize) {
    const a = ear.prev;
    const b = ear;
    const c = ear.next;

    if (area(a, b, c) >= 0) return false;

    const minTX = a.x < b.x ? (a.x < c.x ? a.x : c.x) : (b.x < c.x ? b.x : c.x);
    const minTY = a.y < b.y ? (a.y < c.y ? a.y : c.y) : (b.y < c.y ? b.y : c.y);
    const maxTX = a.x > b.x ? (a.x > c.x ? a.x : c.x) : (b.x > c.x ? b.x : c.x);
    const maxTY = a.y > b.y ? (a.y > c.y ? a.y : c.y) : (b.y > c.y ? b.y : c.y);

    const minZ = zOrder(minTX, minTY, minX, minY, invSize);
    const maxZ = zOrder(maxTX, maxTY, minX, minY, invSize);

    let p = ear.prevZ;
    let n = ear.nextZ;

    while (p && p.z >= minZ && n && n.z <= maxZ) {
        if (p !== ear.prev && p !== ear.next && pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, p.x, p.y) &&
            area(p.prev, p, p.next) >= 0) return false;
        p = p.prevZ;

        if (n !== ear.prev && n !== ear.next && pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, n.x, n.y) &&
            area(n.prev, n, n.next) >= 0) return false;
        n = n.nextZ;
    }

    while (p && p.z >= minZ) {
        if (p !== ear.prev && p !== ear.next && pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, p.x, p.y) &&
            area(p.prev, p, p.next) >= 0) return false;
        p = p.prevZ;
    }

    while (n && n.z <= maxZ) {
        if (n !== ear.prev && n !== ear.next && pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, n.x, n.y) &&
            area(n.prev, n, n.next) >= 0) return false;
        n = n.nextZ;
    }

    return true;
}

function cureLocalIntersections(start, triangles, dim) {
    let p = start;
    do {
        const a = p.prev;
        const b = p.next.next;

        if (!equals(a, b) && intersects(a, p, p.next, b) && locallyInside(a, b) && locallyInside(b, a)) {
            triangles.push(a.i / dim);
            triangles.push(p.i / dim);
            triangles.push(b.i / dim);

            removeNode(p);
            removeNode(p.next);

            p = start = b;
            continue;
        }
        p = p.next;
    } while (p !== start);

    return filterPoints(p);
}

function splitEarcut(start, triangles, dim, minX, minY, invSize) {
    let a = start;
    do {
        let b = a.next.next;
        while (b !== a.prev) {
            if (a.i !== b.i && isValidDiagonal(a, b)) {
                let c = splitPolygon(a, b);

                a = filterPoints(a, a.next);
                c = filterPoints(c, c.next);

                earcutLinked(a, triangles, dim, minX, minY, invSize);
                earcutLinked(c, triangles, dim, minX, minY, invSize);
                return;
            }
            b = b.next;
        }
        a = a.next;
    } while (a !== start);
}

function eliminateHoles(data, holeIndices, outerNode, dim) {
    const queue = [];
    let i, len, start, end, list;

    for (i = 0, len = holeIndices.length; i < len; i++) {
        start = holeIndices[i] * dim;
        end = i < len - 1 ? holeIndices[i + 1] * dim : data.length;
        list = linkedList(data, start, end, dim, false);
        if (list === list.next) list.steiner = true;
        queue.push(getLeftmost(list));
    }

    queue.sort(compareX);

    for (i = 0; i < queue.length; i++) {
        eliminateHole(queue[i], outerNode);
        outerNode = filterPoints(outerNode, outerNode.next);
    }

    return outerNode;
}

function compareX(a, b) {
    return a.x - b.x;
}

function eliminateHole(hole, outerNode) {
    const bridge = findHoleBridge(hole, outerNode);
    if (!bridge) {
        return outerNode;
    }

    const b = splitPolygon(bridge, hole);

    const filteredB = filterPoints(b, b.next);
    return filterPoints(filteredB, filteredB.next);
}

function findHoleBridge(hole, outerNode) {
    let p = outerNode;
    let hx = hole.x;
    let hy = hole.y;
    let qx = -Infinity;
    let m = null;

    do {
        if (hy <= p.y && hy >= p.next.y && p.next.y !== p.y) {
            const x = p.x + (hy - p.y) * (p.next.x - p.x) / (p.next.y - p.y);
            if (x <= hx && x > qx) {
                qx = x;
                if (x === hx) {
                    if (hy === p.y) return p;
                    if (hy === p.next.y) return p.next;
                }
                m = p.x < p.next.x ? p : p.next;
            }
        }
        p = p.next;
    } while (p !== outerNode);

    if (!m) return null;

    if (hx === qx) return m;

    const stop = m;
    const mx = m.x;
    const my = m.y;
    let tanMin = Infinity;
    let tan;

    p = m;

    do {
        if (hx >= p.x && p.x >= mx && hx !== p.x &&
            pointInTriangle(hy < my ? hx : qx, hy, mx, my, qx, hy, p.x, p.y)) {

            tan = Math.abs(hy - p.y) / (hx - p.x);

            if (locallyInside(p, hole) && (tan < tanMin || (tan === tanMin && (p.x > m.x || (p.x === m.x && sectorInSortedOrder(m, p)))))) {
                m = p;
                tanMin = tan;
            }
        }

        p = p.next;
    } while (p !== stop);

    return m;
}

function sectorInSortedOrder(a, b) {
    return area(a.prev, a, b.prev) < 0 && area(b.next, a, a.next) < 0;
}

function indexCurve(start, minX, minY, invSize) {
    let p = start;
    do {
        if (p.z === null) p.z = zOrder(p.x, p.y, minX, minY, invSize);
        p.prevZ = p.prev;
        p.nextZ = p.next;
        p = p.next;
    } while (p !== start);

    p.prevZ.nextZ = null;
    p.prevZ = null;

    sortLinked(p);
}

function sortLinked(list) {
    let inSize = 1;
    let numMerges, pSize, qSize, e, tail, p, q;

    do {
        p = list;
        list = null;
        tail = null;
        numMerges = 0;

        while (p) {
            numMerges++;
            q = p;
            pSize = 0;
            for (let i = 0; i < inSize; i++) {
                pSize++;
                q = q.nextZ;
                if (!q) break;
            }
            qSize = inSize;

            while (pSize > 0 || (qSize > 0 && q)) {
                if (pSize !== 0 && (qSize === 0 || !q || p.z <= q.z)) {
                    e = p;
                    p = p.nextZ;
                    pSize--;
                } else {
                    e = q;
                    q = q.nextZ;
                    qSize--;
                }

                if (tail) tail.nextZ = e;
                else list = e;

                e.prevZ = tail;
                tail = e;
            }

            p = q;
        }

        tail.nextZ = null;
        inSize *= 2;

    } while (numMerges > 1);

    return list;
}

function zOrder(x, y, minX, minY, invSize) {
    x = Math.floor((x - minX) * invSize);
    y = Math.floor((y - minY) * invSize);

    x = (x | (x << 8)) & 0x00FF00FF;
    x = (x | (x << 4)) & 0x0F0F0F0F;
    x = (x | (x << 2)) & 0x33333333;
    x = (x | (x << 1)) & 0x55555555;

    y = (y | (y << 8)) & 0x00FF00FF;
    y = (y | (y << 4)) & 0x0F0F0F0F;
    y = (y | (y << 2)) & 0x33333333;
    y = (y | (y << 1)) & 0x55555555;

    return x | (y << 1);
}

function getLeftmost(start) {
    let p = start;
    let leftmost = start;
    do {
        if (p.x < leftmost.x || (p.x === leftmost.x && p.y < leftmost.y)) leftmost = p;
        p = p.next;
    } while (p !== start);

    return leftmost;
}

function pointInTriangle(ax, ay, bx, by, cx, cy, px, py) {
    return (cx - px) * (ay - py) >= (ax - px) * (cy - py) &&
        (ax - px) * (by - py) >= (bx - px) * (ay - py) &&
        (bx - px) * (cy - py) >= (cx - px) * (by - py);
}

function isValidDiagonal(a, b) {
    return a.next.i !== b.i && a.prev.i !== b.i && !intersectsPolygon(a, b) &&
        locallyInside(a, b) && locallyInside(b, a) && middleInside(a, b) &&
        (area(a.prev, a, b.prev) || area(a, b.prev, b)) &&
        !equals(a, b) && area(a.prev, a, a.next) !== 0 && area(b.prev, b, b.next) !== 0;
}

function area(p, q, r) {
    return (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
}

function equals(p1, p2) {
    return p1.x === p2.x && p1.y === p2.y;
}

function intersects(p1, q1, p2, q2) {
    const o1 = sign(area(p1, q1, p2));
    const o2 = sign(area(p1, q1, q2));
    const o3 = sign(area(p2, q2, p1));
    const o4 = sign(area(p2, q2, q1));

    if (o1 !== o2 && o3 !== o4) return true;

    if (o1 === 0 && onSegment(p1, p2, q1)) return true;
    if (o2 === 0 && onSegment(p1, q2, q1)) return true;
    if (o3 === 0 && onSegment(p2, p1, q2)) return true;
    if (o4 === 0 && onSegment(p2, q1, q2)) return true;

    return false;
}

function onSegment(p, q, r) {
    return q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) && q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y);
}

function sign(num) {
    return num > 0 ? 1 : num < 0 ? -1 : 0;
}

function intersectsPolygon(a, b) {
    let p = a;
    do {
        if (p.i !== a.i && p.next.i !== a.i && p.i !== b.i && p.next.i !== b.i &&
            intersects(p, p.next, a, b)) return true;
        p = p.next;
    } while (p !== a);

    return false;
}

function locallyInside(a, b) {
    if (area(a.prev, a, a.next) < 0) {
        return area(a, b, a.next) >= 0 && area(a, a.prev, b) >= 0;
    } else {
        return area(a, b, a.prev) < 0 || area(a, a.next, b) < 0;
    }
}

function middleInside(a, b) {
    let p = a;
    let inside = false;
    const px = (a.x + b.x) / 2;
    const py = (a.y + b.y) / 2;

    do {
        if (((p.y > py) !== (p.next.y > py)) && p.next.y !== p.y &&
            (px < (p.next.x - p.x) * (py - p.y) / (p.next.y - p.y) + p.x))
            inside = !inside;
        p = p.next;
    } while (p !== a);

    return inside;
}

function splitPolygon(a, b) {
    const a2 = new Node(a.i, a.x, a.y);
    const b2 = new Node(b.i, b.x, b.y);
    const an = a.next;
    const bp = b.prev;

    a.next = b;
    b.prev = a;
    a2.next = an;
    an.prev = a2;
    b2.next = a2;
    a2.prev = b2;
    bp.next = b2;
    b2.prev = bp;

    return b2;
}

function insertNode(i, x, y, last) {
    const p = new Node(i, x, y);

    if (!last) {
        p.prev = p;
        p.next = p;
    } else {
        p.next = last.next;
        p.prev = last;
        last.next.prev = p;
        last.next = p;
    }

    return p;
}

function removeNode(p) {
    p.next.prev = p.prev;
    p.prev.next = p.next;

    if (p.prevZ) p.prevZ.nextZ = p.nextZ;
    if (p.nextZ) p.nextZ.prevZ = p.prevZ;
}

function Node(i, x, y) {
    this.i = i;
    this.x = x;
    this.y = y;
    this.prev = null;
    this.next = null;
    this.z = null;
    this.prevZ = null;
    this.nextZ = null;
    this.steiner = false;
}

function signedArea(data, start, end, dim) {
    let sum = 0;
    for (let i = start, j = end - dim; i < end; i += dim) {
        sum += (data[j] - data[i]) * (data[i + 1] + data[j + 1]);
        j = i;
    }
    return sum;
}

// 偏差計算
earcut.deviation = function (data, holeIndices, dim, triangles) {
    const hasHoles = holeIndices && holeIndices.length;
    const outerlen = hasHoles ? holeIndices[0] * dim : data.length;

    let polygonArea = Math.abs(signedArea(data, 0, outerlen, dim));
    if (hasHoles) {
        for (let i = 0, len = holeIndices.length; i < len; i++) {
            const start = holeIndices[i] * dim;
            const end = i < len - 1 ? holeIndices[i + 1] * dim : data.length;
            polygonArea -= Math.abs(signedArea(data, start, end, dim));
        }
    }

    let trianglesArea = 0;
    for (let i = 0; i < triangles.length; i += 3) {
        const a = triangles[i] * dim;
        const b = triangles[i + 1] * dim;
        const c = triangles[i + 2] * dim;
        trianglesArea += Math.abs((data[a] - data[c]) * (data[b + 1] - data[a + 1]) -
            (data[a] - data[b]) * (data[c + 1] - data[a + 1]));
    }

    return polygonArea === 0 && trianglesArea === 0 ? 0 : Math.abs((trianglesArea - polygonArea) / polygonArea);
};

// フラット化
earcut.flatten = function (data) {
    const dim = data[0][0].length;
    const result = { vertices: [], holes: [], dimensions: dim };
    let holeIndex = 0;

    for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[i].length; j++) {
            for (let d = 0; d < dim; d++) result.vertices.push(data[i][j][d]);
        }
        if (i > 0) {
            holeIndex += data[i - 1].length;
            result.holes.push(holeIndex);
        }
    }
    return result;
};
