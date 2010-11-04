// PhysicsCollisions.js
// Copyright (c) 2008-2010 Christoph Pacher (http://www.christophpacher.com)
//
// This physics library is freely distributable under the terms of an MIT-style license.
// Collisions impulses base on the theroy of Erin Catto's sequential impulses
Physics.Collision = Class.create(
{
    initialize: function(pA, pB, pHitNormalV3D, pHitAxisN, pHitTimeN, pSeparationN)
    {
        this.mA = pA;
        this.mB = pB;
        // the Hitnormal Points away from A aka P1, collisions vel is relative to A aka P1
        this.mHitNormalV3D = pHitNormalV3D;
        this.mHitTimeN = pHitTimeN;
        this.mHitAxisN = pHitAxisN;
        this.mWorldW3D = this.mA.mWorldW3D;
        this.mHitTangent1V3D = this.mWorldW3D.mHitTangentsA[pHitAxisN][0];
        this.mHitTangent2V3D = this.mWorldW3D.mHitTangentsA[pHitAxisN][1];
        this.mPNormalN = 0;
        this.mPNormalBN = 0;
        this.mPTangent1N = 0;
        this.mPTangent2N = 0;
        this.mMassNormalN = 0;
        this.mMassTangent1N = 0;
        this.mMassTangent2N = 0;
        this.mBiasN = 0;
        this.mSeparationN = pSeparationN;
        this.mFrictionN = Math.sqrt(this.mA.mFrictionN * this.mB.mFrictionN);
        this.mRestitutionN = pA.mRestitutionN > pB.mRestitutionN ? pA.mRestitutionN : pB.mRestitutionN;
        this.mSleepsB = false;
        this.mANoImpB = this.mA.mNoCollImpB;
        this.mBNoImpB = this.mB.mNoCollImpB;
    },
    preStep: function(pInvDtN){
        var matv = V3DP;
        var mat = Math;
        var k_allowedPenetration = 0.01;
        var k_biasFactor = this.mWorldW3D.mSplitImpB ? 0.8 : 0.2;
        k_biasFactor = this.mWorldW3D.mPosCorrB ? k_biasFactor : 0.0;

        // Precompute normal mass, tangent mass, and bias.
        var temp = this.mA.mIScaledMassN + this.mB.mIScaledMassN;
        temp = temp > 0 ? 1/temp : 0;
        this.mMassNormalN = temp;
        this.mMassTangent1N = temp;
        this.mMassTangent2N = temp;

        this.mBiasN = -k_biasFactor * pInvDtN * mat.min(0.0, this.mSeparationN + k_allowedPenetration);

        var vmat = V3DP;
        var vRelN = vmat.dot(vmat.sub(this.mB.mVelV3D, this.mA.mVelV3D), this.mHitNormalV3D);
        

        if (vRelN < -this.mWorldW3D.mBounceThresholdN)
        {
            this.mBiasN += -this.mRestitutionN * vRelN;
        }

        this.mANoImpB = this.mA.mNoCollImpB;
        this.mBNoImpB = this.mB.mNoCollImpB;

        if (this.mWorldW3D.mAccumulateImpB)
        {
            // Apply normal + friction impulse
            var PV3D = matv.multNum(this.mHitNormalV3D, this.mPNormalN);
            matv.addDirect(PV3D, matv.multNum(this.mHitTangent1V3D, this.mPTangent1N));
            matv.addDirect(PV3D, matv.multNum(this.mHitTangent2V3D, this.mPTangent2N));

            if(!this.mANoImpB)
            {
                this.mA.mVelV3D[0] -= PV3D[0] * this.mA.mIScaledMassN;
                this.mA.mVelV3D[1] -= PV3D[1] * this.mA.mIScaledMassN;
                this.mA.mVelV3D[2] -= PV3D[2] * this.mA.mIScaledMassN;
            }
            if(!this.mBNoImpB)
            {
                this.mB.mVelV3D[0] += PV3D[0] * this.mB.mIScaledMassN;
                this.mB.mVelV3D[1] += PV3D[1] * this.mB.mIScaledMassN;
                this.mB.mVelV3D[2] += PV3D[2] * this.mB.mIScaledMassN;
            }
        }
    },
    
    applyImpulse: function(){
        // this is called 10 times per collision per step so AVOID function calls
        // and prototype class inits
        var matv = V3DP;
        var mat = Math;
        // Relative velocity at contact
        var dvV3D = [this.mB.mVelV3D[0] - this.mA.mVelV3D[0],
                     this.mB.mVelV3D[1] - this.mA.mVelV3D[1],
                     this.mB.mVelV3D[2] - this.mA.mVelV3D[2]];


        // Compute normal impulse
        var vnN = dvV3D[0] * this.mHitNormalV3D[0] + dvV3D[1] * this.mHitNormalV3D[1] + dvV3D[2] * this.mHitNormalV3D[2];

        var dPnN = 0;
        if (this.mWorldW3D.mSplitImpB)
            dPnN = (-vnN) * this.mMassNormalN;
        else
            dPnN = (-vnN + this.mBiasN) * this.mMassNormalN;

        if (this.mWorldW3D.mAccumulateImpB)
        {
            // Clamp the accumulated impulse
            var Pn0N = this.mPNormalN;
            this.mPNormalN = mat.max(Pn0N + dPnN, 0.0);
            dPnN = this.mPNormalN - Pn0N;
        }
        else
            dPnN = mat.max(dPnN, 0.0);

        // Apply contact impulse

        if(!this.mANoImpB)
        {
            var mult = dPnN * this.mA.mIScaledMassN;
            this.mA.mVelV3D[0] -= this.mHitNormalV3D[0] * mult;
            this.mA.mVelV3D[1] -= this.mHitNormalV3D[1] * mult;
            this.mA.mVelV3D[2] -= this.mHitNormalV3D[2] * mult;
        }
        if(!this.mBNoImpB)
        {
            var mult = dPnN * this.mB.mIScaledMassN;
            this.mB.mVelV3D[0] += this.mHitNormalV3D[0] * mult;
            this.mB.mVelV3D[1] += this.mHitNormalV3D[1] * mult;
            this.mB.mVelV3D[2] += this.mHitNormalV3D[2] * mult;
        }

        if (this.mWorldW3D.mSplitImpB)
        {
            // Compute bias impulse
            dvV3D = [this.mB.mBiasedVelV3D[0] - this.mA.mBiasedVelV3D[0],
                     this.mB.mBiasedVelV3D[1] - this.mA.mBiasedVelV3D[1],
                     this.mB.mBiasedVelV3D[2] - this.mA.mBiasedVelV3D[2]];

            var vnbN = dvV3D[0] * this.mHitNormalV3D[0] + dvV3D[1] * this.mHitNormalV3D[1] + dvV3D[2] * this.mHitNormalV3D[2];
            
            var dPnbN = this.mMassNormalN * (-vnbN + this.mBiasN);
            var Pnb0N = this.mPNormalBN;
            // max + -this.mRestitutionN * vRelN
            this.mPNormalBN = mat.max(Pnb0N + dPnbN, 0.0);
            dPnbN = this.mPNormalBN - Pnb0N;

            if(!this.mANoImpB)
            {
                var mult = dPnbN * this.mA.mIScaledMassN;
                this.mA.mBiasedVelV3D[0] -= this.mHitNormalV3D[0] * mult;
                this.mA.mBiasedVelV3D[1] -= this.mHitNormalV3D[1] * mult;
                this.mA.mBiasedVelV3D[2] -= this.mHitNormalV3D[2] * mult;
            }
            if(!this.mBNoImpB)
            {
                var mult = dPnbN * this.mB.mIScaledMassN;
                this.mB.mBiasedVelV3D[0] += this.mHitNormalV3D[0] * mult;
                this.mB.mBiasedVelV3D[1] += this.mHitNormalV3D[1] * mult;
                this.mB.mBiasedVelV3D[2] += this.mHitNormalV3D[2] * mult;
            }
        }
        // Relative velocity at contact
        dvV3D = [this.mB.mVelV3D[0] - this.mA.mVelV3D[0],
                 this.mB.mVelV3D[1] - this.mA.mVelV3D[1],
                 this.mB.mVelV3D[2] - this.mA.mVelV3D[2]];

        var vtN = dvV3D[0] * this.mHitTangent1V3D[0] + dvV3D[1] * this.mHitTangent1V3D[1] + dvV3D[2] * this.mHitTangent1V3D[2];
        var dPtN = this.mMassTangent1N * (-vtN);

        if (this.mWorldW3D.mAccumulateImpB)
        {
            // Compute friction impulse
            var maxPtN = this.mPNormalN > 0.0 ? this.mFrictionN * this.mPNormalN : 0.01;

            // Clamp friction
            var oldTangentImpulseN = this.mPTangent1N;
            //this.mPTangent1N = MyUtilities.clamp(oldTangentImpulseN + dPtN, -maxPtN, maxPtN);
            this.mPTangent1N = mat.max(-maxPtN, mat.min(oldTangentImpulseN + dPtN, maxPtN));
            dPtN = this.mPTangent1N - oldTangentImpulseN;
        }
        else
        {
            var maxPtN = this.mFrictionN * dPnN;
            dPtN = MyUtilities.clamp(dPtN, -maxPtN, maxPtN);

        }
        // Apply contact impulse

        if(!this.mANoImpB)
        {
            var mult = dPtN * this.mA.mIScaledMassN;
            this.mA.mVelV3D[0] -= this.mHitTangent1V3D[0] * mult;
            this.mA.mVelV3D[1] -= this.mHitTangent1V3D[1] * mult;
            this.mA.mVelV3D[2] -= this.mHitTangent1V3D[2] * mult;
        }
        if(!this.mBNoImpB)
        {
            var mult = dPtN * this.mB.mIScaledMassN;
            this.mB.mVelV3D[0] += this.mHitTangent1V3D[0] * mult;
            this.mB.mVelV3D[1] += this.mHitTangent1V3D[1] * mult;
            this.mB.mVelV3D[2] += this.mHitTangent1V3D[2] * mult;
        }

        // Relative velocity at contact
        dvV3D = [this.mB.mVelV3D[0] - this.mA.mVelV3D[0],
                 this.mB.mVelV3D[1] - this.mA.mVelV3D[1],
                 this.mB.mVelV3D[2] - this.mA.mVelV3D[2]];


        var vttN = dvV3D[0] * this.mHitTangent2V3D[0] + dvV3D[1] * this.mHitTangent2V3D[1] + dvV3D[2] * this.mHitTangent2V3D[2];
        var dPttN = this.mMassTangent2N * (-vttN);

        if (this.mWorldW3D.mAccumulateImpB)
        {
            // Compute friction impulse
            var maxPttN = this.mPNormalN > 0.0 ? this.mFrictionN * this.mPNormalN : 0.01;

            // Clamp friction
            var oldTangentImpulseN = this.mPTangent2N;
            //this.mPTangent2N = MyUtilities.clamp(oldTangentImpulseN + dPttN, -maxPttN, maxPttN);
            this.mPTangent2N = mat.max(-maxPttN, mat.min(oldTangentImpulseN + dPttN, maxPttN));
            dPttN = this.mPTangent2N - oldTangentImpulseN;
        }
        else
        {
            var maxPttN = this.mFrictionN * dPnN;
            dPttN = MyUtilities.clamp(dPttN, -maxPttN, maxPttN);

        }
        // Apply contact impulse

        if(!this.mANoImpB)
        {
            var mult = dPttN * this.mA.mIScaledMassN;
            this.mA.mVelV3D[0] -= this.mHitTangent2V3D[0] * mult;
            this.mA.mVelV3D[1] -= this.mHitTangent2V3D[1] * mult;
            this.mA.mVelV3D[2] -= this.mHitTangent2V3D[2] * mult;
        }
        if(!this.mBNoImpB)
        {
            var mult = dPttN * this.mB.mIScaledMassN;
            this.mB.mVelV3D[0] += this.mHitTangent2V3D[0] * mult;
            this.mB.mVelV3D[1] += this.mHitTangent2V3D[1] * mult;
            this.mB.mVelV3D[2] += this.mHitTangent2V3D[2] * mult;
        }

    }

});
