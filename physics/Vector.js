// Vector.js
// Copyright (c) Christoph Pacher (http://www.christophpacher.com)


var V3DP =
{
    set: function(pV1, x, y, z)
    {
        pV1[0] = x;
        pV1[1] = y;
        pV1[2] = z;
        return pV1;
    },
    copy: function(pV1)
    {
        return [pV1[0], pV1[1], pV1[2]];
    },
    copyDirect: function(pV1, pV2)
    {
        pV1[0] = pV2[0];
        pV1[1] = pV2[1];
        pV1[2] = pV2[2];
        return pV1;
    },
    add: function(pV1, pV2)
    {
        return [pV1[0] + pV2[0], pV1[1] + pV2[1], pV1[2] + pV2[2]];
    },
    addDirect: function(pV1, pV2)
    {
        pV1[0] += pV2[0];
        pV1[1] += pV2[1];
        pV1[2] += pV2[2];
        return pV1;
    },
    sub: function(pV1, pV2)
    {
        return [pV1[0] - pV2[0], pV1[1] - pV2[1], pV1[2] - pV2[2]];
    },
    subDirect: function(pV1, pV2)
    {
        pV1[0] -= pV2[0];
        pV1[1] -= pV2[1];
        pV1[2] -= pV2[2];
        return pV1;
    },
    mult: function(pV1, pV2)
    {
        return [pV1[0] * pV2[0], pV1[1] * pV2[1], pV1[2] * pV2[2]];
    },
    multDirect: function(pV1, pV2)
    {
        pV1[0] *= pV2[0];
        pV1[1] *= pV2[1];
        pV1[2] *= pV2[2];
        return pV1;
    },
    dot: function(pV1, pV2)
    {
        return pV1[0]*pV2[0] + pV1[1]*pV2[1] + pV1[2]*pV2[2];
    },
    multNum: function(pV1, pNum)
    {
        return [pV1[0]*pNum , pV1[1]*pNum , pV1[2]*pNum];
    },
    multNumDirect: function(pV1, pNum)
    {
        pV1[0]*= pNum;
        pV1[1]*= pNum;
        pV1[2]*= pNum;
        return pV1;
    },
    magnitude: function (pV)
    {
        return Math.sqrt(pV[0]*pV[0] + pV[1]*pV[1] + pV[2]*pV[2]);
    },
    normalize: function(pV)
    {
        var m = V3DP.magnitude(pV);
        if (m > 0) {
            V3DP.multNumDirect(pV, 1.0/m);
        }
        return pV;
    }
};