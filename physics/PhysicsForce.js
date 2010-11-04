// PhysicsForce.js
// Copyright (c) 2008-2010 Christoph Pacher (http://www.christophpacher.com)
//
// This physics library is freely distributable under the terms of an MIT-style license.

Physics.Omni = Class.create(
{
    initialize: function(pIdS, pWorldW3D, pAffectedPA, pForceV3D)
    {
        this.mWorldW3D = pWorldW3D;
        this.mWorldIndexN = pWorldW3D.mForcesA.length;
        pWorldW3D.mForcesA[this.mWorldIndexN] = this;
        this.mTypeN = 1;
        this.mIdS = pIdS;
        this.mForceV3D = pForceV3D;
        // if particles are killed, those become sparse arrays!
        this.mAffectedPA = pAffectedPA;
        // the index of the force in the force array of the particle
        this.mAffectedIndexA = [];
        this.mOnB = true;

        var l = pAffectedPA.length;
        var p = null;
        for (var i = 0; i < l; i++)
        {
            p = pAffectedPA[i];
			if(p) {
				this.mAffectedIndexA[i] = p.mAffectedByStaticA.length;
				p.mAffectedByStaticA[this.mAffectedIndexA[i]] = this;
				p.mInForceStaticIndexA[this.mAffectedIndexA[i]] = i;
				p.mForceStaticV3D[0] += pForceV3D[0];
				p.mForceStaticV3D[1] += pForceV3D[1];
				p.mForceStaticV3D[2] += pForceV3D[2];
			}
        }
    },
    setOn: function(onB)
    {
        var l = this.mAffectedPA.length;
        var p = null;
        if (onB)
        {
            for (var i = 0; i < l; i++)
            {
                p = this.mAffectedPA[i];
                if(p)
                {
                    p.mForceStaticV3D[0] += this.mForceV3D[0];
                    p.mForceStaticV3D[1] += this.mForceV3D[1];
                    p.mForceStaticV3D[2] += this.mForceV3D[2];
                }
            }
        }
        else
        {
            for (var i = 0; i < l; i++)
            {
                p = this.mAffectedPA[i];
                if(p)
                {
                    
                    p.mForceStaticV3D[0] -= this.mForceV3D[0];
                    p.mForceStaticV3D[1] -= this.mForceV3D[1];
                    p.mForceStaticV3D[2] -= this.mForceV3D[2];
                }
            }
        }
        this.mOnB = onB;
    },
    updateForce: function(pNewV3D)
    {
        var l = this.mAffectedPA.length;
        var p = null;
        for (var i = 0; i < l; i++)
        {
            p = this.mAffectedPA[i];
            if(p)
            {
                p.mForceStaticV3D[0] -= this.mForceV3D[0] - pNewV3D[0];
                p.mForceStaticV3D[1] -= this.mForceV3D[1] - pNewV3D[1];
                p.mForceStaticV3D[2] -= this.mForceV3D[2] - pNewV3D[2];
            }
        }
        this.mForceV3D = pNewV3D;
    },
    addParticle: function(p)
    {
        var i = this.mAffectedIndexA.length;
        this.mAffectedPA[i] = p;
        this.mAffectedIndexA[i] = p.mAffectedByStaticA.length;
        p.mAffectedByStaticA[this.mAffectedIndexA[i]] = this;
        p.mInForceStaticIndexA[this.mAffectedIndexA[i]] = i;
        if (this.mOnB)
        {
            p.mForceStaticV3D[0] += this.mForceV3D[0];
            p.mForceStaticV3D[1] += this.mForceV3D[1];
            p.mForceStaticV3D[2] += this.mForceV3D[2];
        }
    },
    removeParticle: function(p)
    {
        var lf = p.mAffectedByStaticA.length;
        var f = null;
        var forceIndex = -1;
        for (var j = 0; j < lf; j++)
        {
            f = p.mAffectedByStaticA[j];
            if (f && f.mIdS == this.mIdS)
            {
                forceIndex = j
                break;
            }
        }
        if (forceIndex != -1)
        {
            p.mAffectedByStaticA[forceIndex] = null;
            var i = p.mInForceStaticIndexA[forceIndex];
            p.mInForceStaticIndexA[forceIndex] = null;
            this.mAffectedPA[i] = null;
            this.mAffectedIndexA[i] = null;
            if (this.mOnB)
            {
                p.mForceStaticV3D[0] -= this.mForceV3D[0];
                p.mForceStaticV3D[1] -= this.mForceV3D[1];
                p.mForceStaticV3D[2] -= this.mForceV3D[2];
            }
        }
    }
});

Physics.OmniMassInd = Class.create(
{
    initialize: function(pIdS, pWorldW3D, pAffectedPA, pForceV3D)
    {
        this.mWorldW3D = pWorldW3D;
        this.mWorldIndexN = pWorldW3D.mForcesA.length;
        pWorldW3D.mForcesA[this.mWorldIndexN] = this;
        this.mTypeN = 2;
        this.mIdS = pIdS;
        this.mForceV3D = pForceV3D;
        // if particles are killed, this becomes a sparse array!
        this.mAffectedPA = pAffectedPA;
        this.mAffectedIndexA = [];
        this.mOnB = true;

        var l = pAffectedPA.length;
        var p = null;
        for (var i = 0; i < l; i++)
        {
            p = pAffectedPA[i]; 
			if(p){
				this.mAffectedIndexA[i] = p.mAffectedByStaticA.length;
				p.mAffectedByStaticA[this.mAffectedIndexA[i]] = this;
				p.mInForceStaticIndexA[this.mAffectedIndexA[i]] = i;
				p.mForceStaticMIndV3D[0] += pForceV3D[0];
				p.mForceStaticMIndV3D[1] += pForceV3D[1];
				p.mForceStaticMIndV3D[2] += pForceV3D[2];
			}
        }

    },
    setOn: function(onB)
    {
        var l = this.mAffectedPA.length;
        var p = null;
        if (onB)
        {
            for (var i = 0; i < l; i++)
            {
                p = this.mAffectedPA[i];
                if(p)
                {
                    
                    p.mForceStaticMIndV3D[0] += this.mForceV3D[0];
                    p.mForceStaticMIndV3D[1] += this.mForceV3D[1];
                    p.mForceStaticMIndV3D[2] += this.mForceV3D[2];
                }
            }
        }
        else
        {
            for (var i = 0; i < l; i++)
            {
                p = this.mAffectedPA[i];
                if(p)
                {
                    
                    p.mForceStaticMIndV3D[0] -= this.mForceV3D[0];
                    p.mForceStaticMIndV3D[1] -= this.mForceV3D[1];
                    p.mForceStaticMIndV3D[2] -= this.mForceV3D[2];
                 }
            }
        }
        this.mOnB = onB;
    },
    updateForce: function(pNewV3D)
    {
        var l = this.mAffectedPA.length;
        var p = null;
        for (var i = 0; i < l; i++)
        {
            p = this.mAffectedPA[i];
            if(p)
            {
                
                p.mForceStaticMIndV3D[0] -= this.mForceV3D[0] - pNewV3D[0];
                p.mForceStaticMIndV3D[1] -= this.mForceV3D[1] - pNewV3D[1];
                p.mForceStaticMIndV3D[2] -= this.mForceV3D[2] - pNewV3D[2];
            }
        }
        this.mForceV3D = pNewV3D;
    },
    addParticle: function(p)
    {
        var i = this.mAffectedIndexA.length;
        this.mAffectedPA[i] = p;
        this.mAffectedIndexA[i] = p.mAffectedByStaticA.length;
        p.mAffectedByStaticA[this.mAffectedIndexA[i]] = this;
        p.mInForceStaticIndexA[this.mAffectedIndexA[i]] = i;
        if (this.mOnB)
        {
            p.mForceStaticMIndV3D[0] += this.mForceV3D[0];
            p.mForceStaticMIndV3D[1] += this.mForceV3D[1];
            p.mForceStaticMIndV3D[2] += this.mForceV3D[2];
        }
    },
    removeParticle: function(p)
    {
        var lf = p.mAffectedByStaticA.length;
        var f = null;
        var forceIndex = -1;
        for (var j = 0; j < lf; j++)
        {
            f = p.mAffectedByStaticA[j];
            if (f && f.mIdS == this.mIdS)
            {
                forceIndex = j
                break;
            }
        }
        if (forceIndex != -1)
        {
            p.mAffectedByStaticA[forceIndex] = null;
            var i = p.mInForceStaticIndexA[forceIndex];
            p.mInForceStaticIndexA[forceIndex] = null;
            this.mAffectedPA[i] = null;
            this.mAffectedIndexA[i] = null;
            if (this.mOnB)
            {
                p.mForceStaticMIndV3D[0] -= this.mForceV3D[0];
                p.mForceStaticMIndV3D[1] -= this.mForceV3D[1];
                p.mForceStaticMIndV3D[2] -= this.mForceV3D[2];
            }
        }
    }
});

Physics.Attraction = Class.create(
{
    initialize: function(pIdS, pWorldW3D, pAffectedP, pSourceP, pAffectSourceB, pStrengthN, pMinDistanceN, pMaxDistanceN)
    {
        this.mWorldW3D = pWorldW3D;
        this.mWorldIndexN = pWorldW3D.mForcesA.length;
        pWorldW3D.mForcesA[this.mWorldIndexN] = this;
        this.mTypeN = 3;
        this.mIdS = pIdS;
        this.mOnB = true;


        // the min and max distance (m) between the particles, for the force to work in
        this.mMinDistanceN = pMinDistanceN;
        this.mMaxDistanceN = pMaxDistanceN;
        //is the source attracted to the other particle
        this.mAffectSourceB = pAffectSourceB;
        // make this negativ and you have a repell
        this.mStrengthN = pStrengthN;

        this.mAffectedP = pAffectedP;
        this.mInAffectedIndexN = this.mAffectedP.mAffectedByA.length;
        this.mAffectedP.mAffectedByA[this.mInAffectedIndexN] = this;
        this.mAffectedP.mInForceIndexA[this.mInAffectedIndexN] = -1;

        this.mSourceP = pSourceP;
        this.mInSourceIndexN = this.mSourceP.mAffectedByA.length;
        this.mSourceP.mAffectedByA[this.mInSourceIndexN] = this;
        this.mSourceP.mInForceIndexA[this.mInSourceIndexN] = -1;
    },
    setOn: function(onB)
    {
        this.mOnB = onB;
    }
});

Physics.Spring = Class.create(
{
    initialize: function(pIdS, pWorldW3D, pAffectedP, pSourceP, pAffectSourceB, pSpringKN, pRestLenN, pDampN, pDrawLineB)
    {
        this.mWorldW3D = pWorldW3D;
        this.mWorldIndexN = pWorldW3D.mForcesA.length;
        pWorldW3D.mForcesA[this.mWorldIndexN] = this;
        this.mTypeN = 4;
        this.mIdS = pIdS;
        this.mOnB = true;
        this.mDrawLineB = pDrawLineB;
        this.mPLine;        
        
        // the min and max distance (m) between the particles, for the force to work in
        this.mSpringKN = pSpringKN;
        this.mRestLenN = pRestLenN;
        //is the source attracted to the other particle
        this.mAffectSourceB = pAffectSourceB;
        this.mDampN = pDampN;

        this.mAffectedP = pAffectedP;
        this.mInAffectedIndexN = this.mAffectedP.mAffectedByA.length;
        this.mAffectedP.mAffectedByA[this.mInAffectedIndexN] = this;
        this.mAffectedP.mInForceIndexA[this.mInAffectedIndexN] = -1;

        this.mSourceP = pSourceP;
        this.mInSourceIndexN = this.mSourceP.mAffectedByA.length;
        this.mSourceP.mAffectedByA[this.mInSourceIndexN] = this;
        this.mSourceP.mInForceIndexA[this.mInSourceIndexN] = -1;
        
        if(this.mDrawLineB) {
        		this.mPLine = this.mWorldW3D.addParticleLine(this.mSourceP, this.mAffectedP);
        }
    },
    setOn: function(onB)
    {
        this.mOnB = onB;
    }
});