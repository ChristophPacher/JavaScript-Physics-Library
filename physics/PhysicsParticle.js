// PhysicsParticle.js
// Copyright (c) 2008-2010 Christoph Pacher (http://www.christophpacher.com)
//
// This physics library is freely distributable under the terms of an MIT-style license.
Physics.Particle = Class.create(
{
    initialize: function(pWorldW3D, pPosV3D, pExtV3D, pMassN, pVelocityV3D, pSpriteO, pNumN){
        var matv = V3DP;
        this.mNumN = pNumN;
        this.mWorldW3D = pWorldW3D;
        this.mParticleLinePL = null;
        this.mCollisionsH = new Hash();
        // the DOM HTML element
        this.mSpriteO = pSpriteO;
        // in meters
        this.mExtV3D = pExtV3D;

        // in the middle of the particle in meters
        this.mPosV3D = pPosV3D;

        this.mScaleN = 1.0;
        // the new scale val from extern app is written here and then applied to 
        // the particle during a step and afterwards set to 0
        this.mNewScaleN = 0.0;
        // if a new scale was applied this is set true, and a different collision
        // normal is used in the collision algorithm
		this.mOldRenderScaleN = 0.0;
        this.mScaledB = false;
        this.mScaledExtV3D = matv.multNum(this.mExtV3D, this.mScaleN);


        this.mPosOldV3D = matv.copy(this.mPosV3D);
        this.mDisplaceV3D = [0,0,0];

        this.mMaxV3D = matv.add(this.mPosV3D, this.mScaledExtV3D);
        this.mMinV3D = matv.sub(this.mPosV3D, this.mScaledExtV3D);
        this.mMaxOldV3D = matv.add(this.mPosOldV3D, this.mScaledExtV3D);
        this.mMinOldV3D = matv.sub(this.mPosOldV3D, this.mScaledExtV3D);

        // in kilogramms
        this.mMassN = pMassN;
        this.mIMassN = this.mMassN > 0 ? 1.0/this.mMassN : 0;
        this.mScaledMassN = this.mMassN * this.mScaleN;
        this.mIScaledMassN = this.mScaledMassN > 0 ? 1.0/this.mScaledMassN : 0;
        // in meters per second
        this.mVelV3D = pVelocityV3D;
        this.mBiasedVelV3D = [0,0,0];

        this.mExternalImpulsesA = [];
        // if forces are killed, this becomes a sparse array!
        this.mAffectedByA = [];
        this.mAffectedByStaticA = [];
        // forces that are independent of time and space
        this.mForceStaticV3D = [0,0,0];
        // forces that are independent of time space and the particl mass
        this.mForceStaticMIndV3D = [0,0,0];
        // the index of the particle in the array of the force object
        this.mInForceIndexA =[];
        this.mInForceStaticIndexA =[];

        this.mSleepsB = false;
        // user controlled particles are not allowed to sleep
        this.mCanSleepB = true;
        // spleeping threshold
        this.mSleepEpsilonN = 0.001;
        // mVelV3D.dot(mVelV3D) recency weighted averages
        this.mMotionN = this.mSleepEpsilonN * 2;
        // controls how much of the current vel is added to the average vel in mMotionN
        this.mSleepBiasN = Math.pow(0.4, this.mWorldW3D.mDeltaTimeN);
        this.mStepsToSleepN = 5;
        this.mStepsSleepCountN = 0;

        this.mDampingN = 0.98;

        // the air or water drag
        this.mDragN = 0;
        // drag calculation should be adapted to your needs
        this.updateDrag();

        // how much energy of the collision speed is transfered to the
        // separation velocity
        this.mRestitutionN = 0.0;
        this.mFrictionN = 0.2;
        // true, no collision impulses are applied to the body by the collision resolver
        this.mNoCollImpB = false;
        // true, this particle generates no new collisions
        // existing collisions in this.mCollisionsH still will be considered
        // in collision resolution
        this.mNoCollB = false;
        // true, no world forces are applied to the body
        this.mNoForcesB = false;
        // true, this particle skips pos and vel integration
        this.mNoIntegrationB = false;
        // flag for wakeup fuction
        this.mExControlledB = false;
    },


    calcAcceleration: function(pVelocityV3D, pPosV3D)
    {
        var matv = V3DP;
        var mat = Math;
        var forcesSumV3D = [this.mForceStaticV3D[0], this.mForceStaticV3D[1],
                            this.mForceStaticV3D[2]];
        var i = 0;
        var forces = this.mAffectedByA;
        var i = this.mAffectedByA.length;
        var f = null;
        while (i--)
        {
            if (forces[i])
            {

                f = forces[i];
                if (f && f.mOnB)
                {
                    switch(f.mTypeN)
                    {
                        // attraction
                        case 3:
                            if (f.mSourceP.mNumN == this.mNumN)
                            {
                                if (f.mAffectSourceB)
                                {
                                    var distV3D = [f.mAffectedP.mPosV3D[0] - pPosV3D[0],
                                                   f.mAffectedP.mPosV3D[1] - pPosV3D[1],
                                                   f.mAffectedP.mPosV3D[2] - pPosV3D[2]];
                                    var distN = mat.sqrt(distV3D[0] * distV3D[0] + distV3D[1] * distV3D[1] + distV3D[2] * distV3D[2]);

                                    if (distN < f.mMaxDistanceN && distN > f.mMinDistanceN)
                                    {
                                        var mult = f.mStrengthN * f.mAffectedP.mMassN * this.mMassN / (distN * distN *distN);
                                        forcesSumV3D[0] += distV3D[0] * mult;
                                        forcesSumV3D[1] += distV3D[1] * mult;
                                        forcesSumV3D[2] += distV3D[2] * mult;
                                        if (this.mMotionN > this.mSleepEpsilonN && f.mAffectedP.mSleepsB && f.mAffectedP.mNumN != -1) f.mAffectedP.setAwake(true);
                                    }
                                }
                            }
                            else
                            {
                                var distV3D = [f.mSourceP.mPosV3D[0] - pPosV3D[0],
                                               f.mSourceP.mPosV3D[1] - pPosV3D[1],
                                               f.mSourceP.mPosV3D[2] - pPosV3D[2]];
                                var distN = mat.sqrt(distV3D[0] * distV3D[0] + distV3D[1] * distV3D[1] + distV3D[2] * distV3D[2]);

                                if (distN < f.mMaxDistanceN && distN > f.mMinDistanceN)
                                {
                                    // F = G*m1*m2/ d*d
                                    // the third distN is for normalization
                                    var mult = f.mStrengthN * f.mSourceP.mMassN * this.mMassN / (distN * distN *distN);
                                    forcesSumV3D[0] += distV3D[0] * mult;
                                    forcesSumV3D[1] += distV3D[1] * mult;
                                    forcesSumV3D[2] += distV3D[2] * mult;
                                    if (this.mMotionN > this.mSleepEpsilonN && f.mSourceP.mSleepsB && f.mSourceP.mNumN != -1) f.mSourceP.setAwake(true);
                                }
                            }
                            break;
                        
                        // spring
                        case 4:
                            if (f.mSourceP.mNumN == this.mNumN)
                            {
                                if (f.mAffectSourceB)
                                {
                                    var distV3D = [f.mAffectedP.mPosV3D[0] - pPosV3D[0],
                                                   f.mAffectedP.mPosV3D[1] - pPosV3D[1],
                                                   f.mAffectedP.mPosV3D[2] - pPosV3D[2]];
                                    var distN = mat.sqrt(distV3D[0] * distV3D[0] + distV3D[1] * distV3D[1] + distV3D[2] * distV3D[2]);
                                    var relVelV3D = [f.mAffectedP.mVelV3D[0] - pVelocityV3D[0],
                                                     f.mAffectedP.mVelV3D[1] - pVelocityV3D[1],
                                                     f.mAffectedP.mVelV3D[2] - pVelocityV3D[2]];
                                    var mult = (distN - f.mRestLenN) * f.mSpringKN / (distN);
                                    forcesSumV3D[0] += (distV3D[0] * mult) - (f.mDampN * relVelV3D[0]);
                                    forcesSumV3D[1] += (distV3D[1] * mult) - (f.mDampN * relVelV3D[1]);
                                    forcesSumV3D[2] += (distV3D[2] * mult) - (f.mDampN * relVelV3D[2]);
                                        if (mat.abs(mult) > 0.01 &&
                                            this.mMotionN > this.mSleepEpsilonN &&
                                            f.mAffectedP.mSleepsB &&
                                            f.mAffectedP.mNumN != -1) f.mAffectedP.setAwake(true);
                                }
                            }
                            else
                            {
                                // F = -k(|x|-d)(x/|x|) - bv
                                var distV3D = [f.mSourceP.mPosV3D[0] - pPosV3D[0],
                                               f.mSourceP.mPosV3D[1] - pPosV3D[1],
                                               f.mSourceP.mPosV3D[2] - pPosV3D[2]];
                                var distN = mat.sqrt(distV3D[0] * distV3D[0] + distV3D[1] * distV3D[1] + distV3D[2] * distV3D[2]);
                                var relVelV3D = [f.mSourceP.mVelV3D[0] - pVelocityV3D[0],
                                                 f.mSourceP.mVelV3D[1] - pVelocityV3D[1],
                                                 f.mSourceP.mVelV3D[2] - pVelocityV3D[2]];
                                var mult = (distN - f.mRestLenN) * f.mSpringKN / (distN);
                                forcesSumV3D[0] += (distV3D[0] * mult) - (f.mDampN * relVelV3D[0]);
                                forcesSumV3D[1] += (distV3D[1] * mult) - (f.mDampN * relVelV3D[1]);
                                forcesSumV3D[2] += (distV3D[2] * mult) - (f.mDampN * relVelV3D[2]);
                                if (mat.abs(mult) > 0.01 &&
                                    this.mMotionN > this.mSleepEpsilonN &&
                                    f.mSourceP.mSleepsB &&
                                    f.mSourceP.mNumN != -1) f.mSourceP.setAwake(true);
                            }
                            break;
                    }
                }
            }
        }
        if (this.mDragN != 0)
        {
            forcesSumV3D[0] -= pVelocityV3D[0] *this.mDragN;
            forcesSumV3D[1] -= pVelocityV3D[1] *this.mDragN;
            forcesSumV3D[2] -= pVelocityV3D[2] *this.mDragN;
        }
        
        forcesSumV3D[0] *= this.mIScaledMassN;
        forcesSumV3D[1] *= this.mIScaledMassN;
        forcesSumV3D[2] *= this.mIScaledMassN;
        forcesSumV3D[0] += this.mForceStaticMIndV3D[0];
        forcesSumV3D[1] += this.mForceStaticMIndV3D[1];
        forcesSumV3D[2] += this.mForceStaticMIndV3D[2];


        return forcesSumV3D;
    },

    setAwake: function(awakeB)
    {
        if (awakeB)
        {
            if (!this.mExControlledB)
            {
                this.mNoCollImpB = false;
                this.mNoIntegrationB = false;
            }

            //this.mMotionN = this.mSleepEpsilonN *2.0;
            this.mStepsSleepCountN = 0;
            
            this.mSleepsB = false;
            var i, c, aSleeps, bSleeps = 0;
            
            for( i in this.mCollisionsH._object)
            {
               // Bug Fix for "[object Object]" exists in _object after deleting an
               // Hash entry
               if (i != "[object Object]")
               {
                   c = this.mCollisionsH._object[i];
                   aSleeps = c.mA.mSleepsB;
                   bSleeps = c.mB.mSleepsB;

                   // if mNumN == -1 it is a bounding object which never wake up
                   if (aSleeps && c.mA.mNumN != -1) c.mA.setAwake(true);
                   else if (bSleeps && c.mB.mNumN != -1) c.mB.setAwake(true);
                   c.mSleepsB = false;
               }
            }
        }
        else if (this.mCanSleepB)
        {
            if (this.mStepsSleepCountN > this.mStepsToSleepN)
            {
                this.mSleepsB = true;
                this.mVelV3D[0] = 0;
                this.mVelV3D[1] = 0;
                this.mVelV3D[2] = 0;
                // set Integration and CollImpulses off so that
                // invers impulses from mirco collisions between
                // stacking boxes dont accumulate in mVelV3D of the sleeping box.
                // this vel is used to compute the constraints.if it accumulates
                // the upper box thinks, the lower moves downwards, what is wrong
                this.mNoIntegrationB = true;
                this.mNoCollImpB = true;
            }
            else
                this.mStepsSleepCountN++;
        }
    },

    killCollisions: function()
    {
        var collisionsO = this.mCollisionsH._object;
        var c, aSleeps, bSleeps, key, aNum, bNum  = 0;
        var numParticle = this.mNumN;
        for( key in collisionsO)
        {
           // Bug Fix for "[object Object]" exists in _object after deleting an
           // Hash entry
           if (key != "[object Object]")
           {
               this.mWorldW3D.mCollisionsH.unset(key);
               c = collisionsO[key];
               aSleeps = c.mA.mSleepsB;
               bSleeps = c.mB.mSleepsB;
               aNum = c.mA.mNumN;
               bNum = c.mB.mNumN;

               // if mNumN == -1 it is a bounding object which never wake up
               if (aNum != numParticle)
               {
                   if (aNum != -1)
                   {
                       c.mA.mCollisionsH.unset(key);
                       if (aSleeps) c.mA.setAwake(true);
                   }
               }
               else
               {
                   if (bNum != -1)
                   {
                        c.mB.mCollisionsH.unset(key);
                        if (bSleeps) c.mB.setAwake(true);
                   }
               }
           }
        }
    },
    

    updateDrag: function()
    {
        // this is just an unscientific estimation and should be adapted to the
        // maximum sizes of the particles
        this.mDragN = (this.mScaledExtV3D[0] * this.mScaledExtV3D[1])/100.0;
        if (this.mDragN > 1.0) this.mDrag = 1.0;
    },

    setScale: function(pScaleN)
    {
        this.mScaleN = pScaleN;
        this.mScaledExtV3D = V3DP.multNum(this.mExtV3D, this.mScaleN);
        this.mScaledMassN = this.mMassN * this.mScaleN;
        this.mIScaledMassN = 1.0/this.mScaledMassN;
    },

    stepVel: function(pDeltaTimeN, pIDeltaTimeN)
    {
        this.mVelV3D[0] *= this.mDampingN;
        this.mVelV3D[1] *= this.mDampingN;
        this.mVelV3D[2] *= this.mDampingN;
        this.mDisplaceV3D[0] *= this.mDampingN;
        this.mDisplaceV3D[1] *= this.mDampingN;
        this.mDisplaceV3D[2] *= this.mDampingN;
        

        if (!this.mNoForcesB)
        {
            //Euler Integration
//            var accelV3D = this.calcAcceleration(this.mVelV3D);
//            this.mVelV3D[0] += accelV3D[0] * pDeltaTimeN;
//            this.mVelV3D[1] += accelV3D[1] * pDeltaTimeN;
//            this.mVelV3D[2] += accelV3D[2] * pDeltaTimeN;

            //Runge Kutta Second Order Integration
            var k1V3D = this.calcAcceleration(this.mVelV3D, this.mPosV3D);
            var nextVelV3D = [this.mVelV3D[0] + (k1V3D[0] * pDeltaTimeN),
                              this.mVelV3D[1] + (k1V3D[1] * pDeltaTimeN),
                              this.mVelV3D[2] + (k1V3D[2] * pDeltaTimeN)];
            var nextPosV3D = [this.mPosV3D[0] + (this.mVelV3D[0] * pDeltaTimeN),
                              this.mPosV3D[1] + (this.mVelV3D[1] * pDeltaTimeN),
                              this.mPosV3D[2] + (this.mVelV3D[2] * pDeltaTimeN)];
            var k2V3D = this.calcAcceleration(nextVelV3D, nextPosV3D);
            var mult = pDeltaTimeN/2.0;
            this.mVelV3D[0] += (k1V3D[0] + k2V3D[0]) * mult;
            this.mVelV3D[1] += (k1V3D[1] + k2V3D[1]) * mult;
            this.mVelV3D[2] += (k1V3D[2] + k2V3D[2]) * mult;
        }

        var l = this.mExternalImpulsesA.length;
        if ( l > 0)
        {
            for (var i = 0; i < l; i++)
            {
                this.mVelV3D[0] += this.mExternalImpulsesA[i][0] * pIDeltaTimeN * this.mIMassN;
                this.mVelV3D[1] += this.mExternalImpulsesA[i][1] * pIDeltaTimeN * this.mIMassN;
                this.mVelV3D[2] += this.mExternalImpulsesA[i][2] * pIDeltaTimeN * this.mIMassN;
            }
            this.mExternalImpulsesA = [];
        }
    },

    stepPos: function(pDeltaTimeN)
    {
        this.mPosOldV3D[0] = this.mPosV3D[0];
        this.mPosOldV3D[1] = this.mPosV3D[1];
        this.mPosOldV3D[2] = this.mPosV3D[2];
        
        this.mMaxOldV3D[0] = this.mMaxV3D[0];
        this.mMaxOldV3D[1] = this.mMaxV3D[1];
        this.mMaxOldV3D[2] = this.mMaxV3D[2];

        this.mMinOldV3D[0] = this.mMinV3D[0];
        this.mMinOldV3D[1] = this.mMinV3D[1];
        this.mMinOldV3D[2] = this.mMinV3D[2];


        // Integration
        this.mDisplaceV3D[0] = (this.mVelV3D[0] + this.mBiasedVelV3D[0]) * pDeltaTimeN;
        this.mDisplaceV3D[1] = (this.mVelV3D[1] + this.mBiasedVelV3D[1]) * pDeltaTimeN;
        this.mDisplaceV3D[2] = (this.mVelV3D[2] + this.mBiasedVelV3D[2]) * pDeltaTimeN;

        this.mPosV3D[0] += this.mDisplaceV3D[0];
        this.mPosV3D[1] += this.mDisplaceV3D[1];
        this.mPosV3D[2] += this.mDisplaceV3D[2];

        this.mScaledB = false;
        if (this.mNewScaleN != 0.0)
        {
            this.setScale(this.mNewScaleN);
            this.updateDrag();
            this.mNewScaleN = 0.0;
            this.mScaledB = true;

        }
        this.mMaxV3D[0] = this.mPosV3D[0] + this.mScaledExtV3D[0];
        this.mMaxV3D[1] = this.mPosV3D[1] + this.mScaledExtV3D[1];
        this.mMaxV3D[2] = this.mPosV3D[2] + this.mScaledExtV3D[2];

        this.mMinV3D[0] = this.mPosV3D[0] - this.mScaledExtV3D[0];
        this.mMinV3D[1] = this.mPosV3D[1] - this.mScaledExtV3D[1];
        this.mMinV3D[2] = this.mPosV3D[2] - this.mScaledExtV3D[2];
    },

    externUpdatePos: function(pNewPosV3D, pIDeltaTimeN){
        var matv = V3DP;
        this.mPosOldV3D[0] = this.mPosV3D[0];
        this.mPosOldV3D[1] = this.mPosV3D[1];
        this.mPosOldV3D[2] = this.mPosV3D[2];

        this.mMaxOldV3D[0] = this.mMaxV3D[0];
        this.mMaxOldV3D[1] = this.mMaxV3D[1];
        this.mMaxOldV3D[2] = this.mMaxV3D[2];

        this.mMinOldV3D[0] = this.mMinV3D[0];
        this.mMinOldV3D[1] = this.mMinV3D[1];
        this.mMinOldV3D[2] = this.mMinV3D[2];

        this.mPosV3D = pNewPosV3D;
        this.mDisplaceV3D = matv.sub(pNewPosV3D, this.mPosOldV3D);
        this.mVelV3D = matv.multNum(this.mDisplaceV3D, pIDeltaTimeN);

        this.mScaledB = false;
        if (this.mNewScaleN != 0.0)
        {
            this.setScale(this.mNewScaleN);
            this.updateDrag();
            this.mNewScaleN = 0.0;
            this.mScaledB = true;

        }
        this.mMaxV3D[0] = this.mPosV3D[0] + this.mScaledExtV3D[0];
        this.mMaxV3D[1] = this.mPosV3D[1] + this.mScaledExtV3D[1];
        this.mMaxV3D[2] = this.mPosV3D[2] + this.mScaledExtV3D[2];

        this.mMinV3D[0] = this.mPosV3D[0] - this.mScaledExtV3D[0];
        this.mMinV3D[1] = this.mPosV3D[1] - this.mScaledExtV3D[1];
        this.mMinV3D[2] = this.mPosV3D[2] - this.mScaledExtV3D[2];

        this.mWorldW3D.mRenderer.draw(this);
    },
    externUpdateDisplace: function(pDisplaceV3D, pIDeltaTimeN){
        var matv = V3DP;
        this.mPosOldV3D[0] = this.mPosV3D[0];
        this.mPosOldV3D[1] = this.mPosV3D[1];
        this.mPosOldV3D[2] = this.mPosV3D[2];

        this.mMaxOldV3D[0] = this.mMaxV3D[0];
        this.mMaxOldV3D[1] = this.mMaxV3D[1];
        this.mMaxOldV3D[2] = this.mMaxV3D[2];

        this.mMinOldV3D[0] = this.mMinV3D[0];
        this.mMinOldV3D[1] = this.mMinV3D[1];
        this.mMinOldV3D[2] = this.mMinV3D[2];

        this.mDisplaceV3D = pDisplaceV3D;
        matv.addDirect(this.mPosV3D, pDisplaceV3D);
        this.mVelV3D = matv.multNum(pDisplaceV3D, pIDeltaTimeN);

        this.mScaledB = false;
        if (this.mNewScaleN != 0.0)
        {
            this.setScale(this.mNewScaleN);
            this.updateDrag();
            this.mNewScaleN = 0.0;
            this.mScaledB = true;

        }

        this.mMaxV3D[0] = this.mPosV3D[0] + this.mScaledExtV3D[0];
        this.mMaxV3D[1] = this.mPosV3D[1] + this.mScaledExtV3D[1];
        this.mMaxV3D[2] = this.mPosV3D[2] + this.mScaledExtV3D[2];

        this.mMinV3D[0] = this.mPosV3D[0] - this.mScaledExtV3D[0];
        this.mMinV3D[1] = this.mPosV3D[1] - this.mScaledExtV3D[1];
        this.mMinV3D[2] = this.mPosV3D[2] - this.mScaledExtV3D[2];

        this.mWorldW3D.mRenderer.draw(this);
    }
});

Physics.ParticleLine = Class.create(
{
	initialize: function(pWorldW3D, pP1P, pP2P, pNumN)
	{
		this.mWorldW3D = pWorldW3D;
		this.mP1P = pP1P;
		this.mP2P = pP2P;
		this.mP1P.mParticleLinePL = this;
		this.mP2P.mParticleLinePL = this;
		this.mNumN = pNumN;
		
		this.mWorldW3D.mRenderer.mLineContainer.append("<img id='line"+ pNumN +"' class='line'/>");
		
		
		this.mSpriteO = jQuery( "#line"+ pNumN)[0];
		this.mSpriteO.style.position = 'fixed';
	}
});