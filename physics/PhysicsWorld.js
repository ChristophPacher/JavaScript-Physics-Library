// PhysicsWorld.js
// Copyright (c) 2008-2010 Christoph Pacher (http://www.christophpacher.com)
//
// This physics library is freely distributable under the terms of an MIT-style license.

var Physics =
{
    
};

Physics.World3D = Class.create({
    initialize: function(pRenderer)
    {
        this.mRenderer = pRenderer;
        this.mPeriodical = null;

        this.mBoundsMinV3D = [0,0,0];
        this.mBoundsMaxV3D = [100,100,100];

        // if forces are killed, this becomes a sparse array!
        this.mForcesA = [];
        
        // if particles are killed, this becomes a sparse array!
        this.mParticlesA = [];
		// if lines are killed, this becomes a sparse array!
        this.mParticleLinesA = [];
        // in milliseconds
        this.mLastN = new Date().getTime();
        this.mNowN = 0;
        // in seconds
        this.mDeltaTimeN = 0.03333;
        this.mIDeltaTimeN = 1.0/this.mDeltaTimeN;
        this.mCollisionsH = new Hash();
        this.mStepN = 0;
        this.mIterationsN = 10;
        this.mDummyP = new Physics.Particle(this, 0, 0, 0,
                                        [0,0,0], null, -1);
        this.mDummyP.mSleepsB = true;

        // Hittangets for the spimlified box collisions
        this.mHitTangentsA = new Array(
            new Array([0, 1, 0], [0, 0, 1]),
            new Array([1, 0, 0], [0, 0, 1]),
            new Array([1, 0, 0], [0, 1, 0])
        );

        this.mWarmStartB = true;
        this.mSplitImpB = false;
        this.mAccumulateImpB = true;
        this.mPosCorrB = true;
        this.mBounceThresholdN = 1.0;
		/*
        this.debugOut1 = document.getElementById("debugOut1");
        this.debugOut2 = document.getElementById("debugOut2");
		*/
        
    },
    
    addForce: function(pX, pY, pZ)
    {
		var l = this.mForcesA.length;
        this.mForcesA[l] = [pX, pY, pZ];
        return l;
    },

    step: function()
    {
        this.mStepN++;
        var matv = V3DP;
        
		// an adaptive step time causes the simulation to explode. 
        //this.mNowN = new Date().getTime();
        //this.mDeltaTimeN = (this.mNowN - this.mLastN)/1000;
        //this.mIDeltaTimeN = this.mDeltaTimeN > 0 ? 1.0/this.mDeltaTimeN : 0.0;
        
        // Collide
        var i = 0;
        var j = 0;
        var l = this.mParticlesA.length;
        var p1, p2 = null;
        for(; i < l; i++)
        {
            p1 = this.mParticlesA[i];
            if (p1 == null) continue;
            if (p1.mNoCollB) continue;
            this.collBounds(p1);
            j = i + 1;
            for(; j < l; j++)
            {
                p2 = this.mParticlesA[j];
                if (p2 == null) continue;
                if (p2.mNoCollB) continue;
                this.collAABB(p1, p2);
                //this.collAABBsweep(p1, p2);
            }
        }

        i = 0;
        var p = 0;

        // integrate acceleration
        for(; i < l; i++)
        {
            p = this.mParticlesA[i];
            if (p == null) continue;
            if (!p.mNoIntegrationB)
            {
                
                p.stepVel(this.mDeltaTimeN, this.mIDeltaTimeN);
                p.mBiasedVelV3D[0] = 0; p.mBiasedVelV3D[1] = 0; p.mBiasedVelV3D[2] = 0;
            }
        }

        // perform impulse prestep
        i = null;
        var c = null;
        var aSleeps = false;
        var bSleeps = false;
        // for in loop is faster than hash.each()
        for(i in this.mCollisionsH._object)
        {
           // Bug Fix for "[object Object]" exists in _object after deleting an
           // Hash entry
           if (i != "[object Object]")
           {
               c = this.mCollisionsH._object[i];
               aSleeps = c.mA.mSleepsB;
               bSleeps = c.mB.mSleepsB;
               //console.log(c.mA.mNumN + " "+ c.mB.mNumN + " " + this.mStepN);
               if (c.mSeparationN < -0.015)
               {
                   if (aSleeps && c.mA.mNumN != -1) c.mA.setAwake(true);
                   else if (c.mB.mNumN != -1) c.mB.setAwake(true);
                   c.mSleepsB = false;
                   
               }
               else if (aSleeps && bSleeps)
               {
                   c.mSleepsB = true;
               }
               if (!c.mSleepsB)
                   c.preStep(this.mIDeltaTimeN);
           }
        }

        // perform impulse interations
        i = 0;
        j = 0;
        c = null;
        for(; i < this.mIterationsN; i++)
        {
            for(j in this.mCollisionsH._object)
            {
                if(j != "[object Object]")
                {
                    c = this.mCollisionsH._object[j];
                    if (!c.mSleepsB)
                        c.applyImpulse();
                }
            }
        }


        i = 0;
        p = 0;
        // integrate velocity
        for(; i < l; i++)
        {
            p = this.mParticlesA[i];
            if (p == null) continue;
            if (!p.mSleepsB)
            {
                if (!p.mNoIntegrationB)
                {
                    //console.log(this.mStepN);
                    p.stepPos(this.mDeltaTimeN);
                }
                p.mMotionN = p.mSleepBiasN * p.mMotionN + (1 - p.mSleepBiasN) * matv.dot(p.mVelV3D, p.mVelV3D);
                if (p.mMotionN > 10.0 * p.mSleepEpsilonN) p.mMotionN = 10.0 * p.mSleepEpsilonN;
            
                if (p.mMotionN < p.mSleepEpsilonN && !p.mScaledB)
                    p.setAwake(false);
                this.mRenderer.draw(p);       
            }          
        }
		
		i = 0;
        p = 0;
		l = this.mParticleLinesA.length;
        // draw ParticleLines
        for(; i < l; i++)
        {
            p = this.mParticleLinesA[i];
            if (p == null) continue;
            if (!p.mP1P.mSleepsB || !p.mP2P.mSleepsB)
            {
                Renderer.drawLine(p.mSpriteO, p.mP1P.mSpriteO.posScreenV3D[0], 
								  p.mP1P.mSpriteO.posScreenV3D[1],
								  p.mP1P.mSpriteO.posScreenV3D[2],
								  p.mP2P.mSpriteO.posScreenV3D[0], 
								  p.mP2P.mSpriteO.posScreenV3D[1],
								  p.mP2P.mSpriteO.posScreenV3D[2]);       
            }          
        }
		
        //this.mLastN = this.mNowN;
    },
    reDrawAll: function()
    {
    	var i = 0;
      var p = 0;
			var l = this.mParticleLinesA.length;
      // draw ParticleLines
      for(; i < l; i++)
      {
          p = this.mParticleLinesA[i];
          if (p == null) continue;
          Renderer.drawLine(p.mSpriteO, p.mP1P.mSpriteO.posScreenV3D[0], 
				  p.mP1P.mSpriteO.posScreenV3D[1],
				  p.mP1P.mSpriteO.posScreenV3D[2],
				  p.mP2P.mSpriteO.posScreenV3D[0], 
				  p.mP2P.mSpriteO.posScreenV3D[1],
				  p.mP2P.mSpriteO.posScreenV3D[2]);               
      }
      i = 0;
      p = 0;
      l = this.mParticlesA.length;
      // draw particles
      for(; i < l; i++)
      {
          p = this.mParticlesA[i];
          if (p == null) continue;
          this.mRenderer.draw(p);       
                    
      }    
    },
    addParticle: function(pPosV3D, pExtV3D, pMassN, pVelocityV3D, pSpriteO)
    {
    		var l = this.mParticlesA.length;
        var p = this.mParticlesA[l] = new Physics.Particle
        (
            this, pPosV3D, pExtV3D, pMassN, pVelocityV3D, pSpriteO, l
        );
        return p;
    },
	
	addParticleLine: function(pP1P, pP2P)
    {
    		var l = this.mParticleLinesA.length;
        var p = this.mParticleLinesA[l] = new Physics.ParticleLine
        (
            this, pP1P, pP2P, l
        );
        return p;
    },

    killParticle: function(pP)
    {
		if(pP){
			if(pP.mSpriteO.parentNode) pP.mSpriteO.parentNode.removeChild(pP.mSpriteO);
			pP.killCollisions();
			var lf = pP.mAffectedByA.length;
			var f = null;
			var j = 0;
			if (pP.mParticleLinePL)
				this.killParticleLine(pP.mParticleLinePL);
				
			for (; j < lf; j++)
			{
				f = pP.mAffectedByA[j];
				if (f)
				{
					this.killForce(f);
					f = null;
				}
			}
			lf = pP.mAffectedByStaticA.length;
			for (j = 0; j < lf; j++)
			{
				f = pP.mAffectedByStaticA[j];
				if (f)
				{
					var indexInForce = pP.mInForceStaticIndexA[j];
					f.mAffectedPA[indexInForce ] = null;
					f.mAffectedIndexA[indexInForce] = null;
				}
			}
			this.mParticlesA[pP.mNumN] = null;
		}
    },
    killParticleLine: function(pPL)
    {
			if(pPL){
				pPL.mSpriteO.parentNode.removeChild(pPL.mSpriteO);
				pPL.mWorldW3D.mParticleLinesA[pPL.mNumN] = null;
				pPL.mWorldW3D = null;
				pPL.mP1P.mParticleLinePL = null;
				pPL.mP2P.mParticleLinePL = null;
				pPL.mP1P = null;
				pPL.mP2P = null;
				pPL.mNumN = null;
			}
		},
    killForce: function(f){
        if(f){
	        var p = null;
	
	        switch(f.mTypeN)
	        {
	            case 1:
	                var affectedA = f.mAffectedPA;
	                var l = affectedA.length;
	                var forceV3D = f.mForceV3D;
	                for (var i = 0; i < l; i++)
	                {
	                    p = affectedA[i];
	                    if(p){
												p.mAffectedByStaticA[f.mAffectedIndexA[i]] = null;
												p.mInForceStaticIndexA[f.mAffectedIndexA[i]] = null;
												if(f.mOnB)
												{
													p.mForceStaticV3D[0] -= forceV3D[0];
													p.mForceStaticV3D[1] -= forceV3D[1];
													p.mForceStaticV3D[2] -= forceV3D[2];
												}
											}
	                }
	                f.mAffectedPA = null;
	                f.mAffectedIndexA = null;
	                break;
	            case 2:
	                var affectedA = f.mAffectedPA;
	                var l = affectedA.length;
	                var forceV3D = f.mForceV3D;
	                for (var i = 0; i < l; i++)
	                {
	                    p = affectedA[i];
											if(p){
												p.mAffectedByStaticA[f.mAffectedIndexA[i]] = null;
												p.mInForceStaticIndexA[f.mAffectedIndexA[i]] = null;
												if(f.mOnB)
												{
													p.mForceStaticMIndV3D[0] -= forceV3D[0];
													p.mForceStaticMIndV3D[1] -= forceV3D[1];
													p.mForceStaticMIndV3D[2] -= forceV3D[2];
												}
											}
	                }
	                f.mAffectedPA = null;
	                f.mAffectedIndexA = null;
	                break;
	            // attraction
	            case 3:
	            // spring
	            case 4:
	                f.mAffectedP.mAffectedByA[f.mInAffectedIndexN] = null;
	                f.mAffectedP.mInForceIndexA[f.mInAffectedIndexN] = null;
	                f.mAffectedP = null;
	                f.mInAffectedIndexN = null;
	
	                f.mSourceP.mAffectedByA[f.mInSourceIndexN] = null;
	                f.mSourceP.mInForceIndexA[f.mInSourceIndexN] = null;
	                f.mSourceP = null;
	                f.mInSourceIndexN = null;
	                if(f.mDrawLineB) this.killParticleLine(f.mPLine);
	                f.mPline = null;
	
	                break;
	        }
	        
	        this.mForcesA[f.mWorldIndexN] = null;
	     }
    },

    start: function()
    {
        if (!this.mPeriodical)
            this.mPeriodical = new PeriodicalExecuter(this.step.bind(this), this.mDeltaTimeN);
    },

    stop: function()
    {
        if (this.mPeriodical)
        {
            this.mPeriodical.stop();
            this.mPeriodical = null;
        }
    },
    
    toggleStartStop: function()
    {
        if (!this.mPeriodical)
            this.mPeriodical = new PeriodicalExecuter(this.step.bind(this), this.mDeltaTimeN);
        else
        {
            this.mPeriodical.stop();
            this.mPeriodical = null;
        }
    },

    collBounds: function(pP)
    {
        var k = 0;
        var hitTime = null;
        
        var keyS = "";
        var newC = null;
        var c = null;
        var separationN = 0;
        var returnVal = false;
        var mat = Math;
        
        for(; k < 3; k++)
        {
            keyS = "";
            keyS += pP.mNumN;
            keyS += "_min";
            keyS += k;
            c = this.mCollisionsH._object[keyS];
            if (pP.mMinV3D[k] < this.mBoundsMinV3D[k])
            {
                if (pP.mDisplaceV3D[k] > 0)
                {
                    hitTime = mat.abs((pP.mMinOldV3D[k] - this.mBoundsMinV3D[k])/pP.mDisplaceV3D[k]);
                }
                else hitTime = 0;
                // it is defined that the hitnormal points away from p1 aka A
                var hitNormalV3D = [0,0,0];
                hitNormalV3D[k] = -1;
                
                separationN = pP.mMinV3D[k] - this.mBoundsMinV3D[k];
                if (c)
                {
                    // Update old Collision
                    c.mSeparationN = separationN;
                    c.mHitTimeN = hitTime;
                    if (!this.mWarmStartB)
                    {
                        c.mPNormalN = 0;
                        c.mPNormalBN = 0;
                        c.mPTangent1N = 0;
                        c.mPTangent2N = 0;
                    }
                    returnVal = true;
                }
                else
                {
                    c = new Physics.Collision(
                        pP, this.mDummyP, hitNormalV3D, k, hitTime, separationN);
                    this.mCollisionsH.set(keyS, c);
                    pP.mCollisionsH.set(keyS, c);
                    returnVal = true;
                }
            }
            else
            {
                // delete the collision from the min check (if it existed)
                if(c)
                {
                    this.mCollisionsH.unset(keyS);
                    pP.mCollisionsH.unset(keyS);
                }

                c = null;
                keyS = pP.mNumN;
                keyS += "_max";
                keyS += k;
                c = this.mCollisionsH._object[keyS];
                
                if (pP.mMaxV3D[k] > this.mBoundsMaxV3D[k])
                {
                    if (pP.mDisplaceV3D[k] > 0)
                    {
                        hitTime = mat.abs((this.mBoundsMaxV3D[k] - pP.mMaxOldV3D[k])/pP.mDisplaceV3D[k]);
                    }
                    else hitTime = 0;
                    
                    var hitNormalV3D = [0,0,0];
                    hitNormalV3D[k] = 1;

                    separationN = this.mBoundsMaxV3D[k] - pP.mMaxV3D[k];
                    
                    if (c)
                    {
                        // Update old Collision
                        c.mSeparationN = separationN;
                        c.mHitTimeN = hitTime;
                        if (!this.mWarmStartB)
                        {
                            c.mPNormalN = 0;
                            c.mPNormalBN = 0;
                            c.mPTangent1N = 0;
                            c.mPTangent2N = 0;
                        }
                    }
                    else
                    {
                        c = new Physics.Collision(
                            pP, this.mDummyP, hitNormalV3D, k, hitTime, separationN);
                        this.mCollisionsH.set(keyS, c);
                        pP.mCollisionsH.set(keyS, c);
                        returnVal = true;
                    }
                } 
                else
                {
                    if(c)
                    {
                         this.mCollisionsH.unset(keyS);
                         pP.mCollisionsH.unset(keyS);
                    }
                }
            }
        }
        return returnVal;

    },
    collAABB: function(pP1, pP2)
    {
        var mat = Math;
        var matv = V3DP;
        var p1p2V3D = [pP2.mPosV3D[0] - pP1.mPosV3D[0],
                        pP2.mPosV3D[1] - pP1.mPosV3D[1],
                        pP2.mPosV3D[2] - pP1.mPosV3D[2],];
        var keyS = "";
        if (pP1.mNumN < pP2.mNumN)
        {
            // += faster than b + "asdf" + b
            keyS += pP1.mNumN;
            keyS += "_";
            keyS += pP2.mNumN;
        }
        else
        {
            keyS += pP2.mNumN;
            keyS += "_";
            keyS += pP1.mNumN;
        }
        var c = this.mCollisionsH._object[keyS];
        var returnValB = false;

        var p1p2ExtV3D = [pP1.mScaledExtV3D[0] + pP2.mScaledExtV3D[0],
                          pP1.mScaledExtV3D[1] + pP2.mScaledExtV3D[1],
                          pP1.mScaledExtV3D[2] + pP2.mScaledExtV3D[2],];
        var absP1p2V3D = [mat.abs(p1p2V3D[0]), mat.abs(p1p2V3D[1]), mat.abs(p1p2V3D[2])];
        var i = 0;
        if(absP1p2V3D[0] <= p1p2ExtV3D[0] &&
           absP1p2V3D[1] <= p1p2ExtV3D[1] &&
           absP1p2V3D[2] <= p1p2ExtV3D[2])
        {
            if (c)
            {
                // collision existed in last step, update
                // perhaps normal recalc needed
                if(pP1.mScaledB || pP2.mScaledB)
                {
                    // the particle was scaled in the last integration step
                    // to simulate the collision response caused by the expansion
                    // of the particle the HitNormal is p1p2V3D, the hittagents
                    // still lie in the hitting boxface
                    var HitNormalV3D = matv.copy(p1p2V3D);
                    matv.normalize(HitNormalV3D);
                    i = 1;
                    var maxDir = 0;
                    for (; i < 3; i++)
                    {
                        if (absP1p2V3D[i] > absP1p2V3D[maxDir]) maxDir = i;
                    }
                    var HitNormalFaceV3D = [0,0,0];
                    HitNormalFaceV3D[maxDir] = p1p2V3D[maxDir] > 0 ? 1 : -1;
                    var separationFaceNormalN = absP1p2V3D[maxDir] - (pP1.mScaledExtV3D[maxDir] + pP2.mScaledExtV3D[maxDir]);
                    var cosAlpha = matv.dot(HitNormalV3D, HitNormalFaceV3D);
                    var separationN = 0;
                    if (cosAlpha == 0) separationN = separationFaceNormalN;
                    else  separationN = separationFaceNormalN / cosAlpha;

                    c.mSeparationN = separationN;
                    c.mHitNormalV3D = HitNormalV3D;
                    c.mHitTangent1V3D = this.mHitTangentsA[maxDir][0];
                    c.mHitTangent2V3D = this.mHitTangentsA[maxDir][1];
                }
                else
                {
                    c.mSeparationN = absP1p2V3D[c.mHitAxisN] - (pP1.mScaledExtV3D[c.mHitAxisN] + pP2.mScaledExtV3D[c.mHitAxisN]);
                   
                }
                c.mHitTimeN = 0;
//                if(pP1.mNumN == 0){
//                    this.debugOut1.innerHTML = pP2.mNumN+" " + c.mSeparationN ;
//                }
                
                if (!this.mWarmStartB)
                {
                    c.mPNormalN = 0;
                    c.mPNormalBN = 0;
                    c.mPTangent1N = 0;
                    c.mPTangent2N = 0;
                }
                returnValB = true;

            }
            else
            {
                // this is a new collision

                var HitNormalV3D = [0,0,0];
                
                if(pP1.mScaledB || pP2.mScaledB)
                {
                    
                    // the particle was scaled in the last integration step
                    // to simulate the collision response caused by the expansion
                    // of the particle the HitNormal is p1p2V3D, the hittagents
                    // still lie in the hitting box face
                    HitNormalV3D = matv.copy(p1p2V3D);
                    matv.normalize(HitNormalV3D);
                    i = 1;
                    var maxDir = 0;
                    for (; i < 3; i++)
                    {
                        if (absP1p2V3D[i] > absP1p2V3D[maxDir]) maxDir = i;
                    }
                    var HitNormalFaceV3D = [0,0,0];
                    HitNormalFaceV3D[maxDir] = p1p2V3D[maxDir] > 0 ? 1 : -1;
                    var separationFaceNormalN = absP1p2V3D[maxDir] - (pP1.mScaledExtV3D[maxDir] + pP2.mScaledExtV3D[maxDir]);
                    var cosAlpha = matv.dot(HitNormalV3D, HitNormalFaceV3D);
                    var separationN = 0;
                    // the angle is 0 the Normals are the same
                    if (cosAlpha == 0) separationN = separationFaceNormalN;
                    // the Separation along the Normals form a Triangle.
                    // Use Trigonometry  to cal separation along HitNormal
                    else  separationN = separationFaceNormalN / cosAlpha;
                    c = new Physics.Collision(pP1, pP2, HitNormalV3D, maxDir, 0, separationN);
                }
                else
                {
                    var overIn = [0,0,0];
                    i = 0;
                    var pVelRelV3D = [pP2.mDisplaceV3D[0] - pP1.mDisplaceV3D[0],
                                      pP2.mDisplaceV3D[1] - pP1.mDisplaceV3D[1],
                                      pP2.mDisplaceV3D[2] - pP1.mDisplaceV3D[2]];
                    for( ; i<3 ; i++)
                    {
                        if( pP1.mMaxOldV3D[i] < pP2.mMinOldV3D[i] && pVelRelV3D[i] < 0 )
                        {
                            overIn[i] = (pP1.mMaxOldV3D[i] - pP2.mMinOldV3D[i]) / pVelRelV3D[i];
                        }
                        else if( pP2.mMaxOldV3D[i] < pP1.mMinOldV3D[i] && pVelRelV3D[i] > 0 )
                        {
                            overIn[i] = (pP1.mMinOldV3D[i] - pP2.mMaxOldV3D[i]) / pVelRelV3D[i];
                        }
                    }
                    i = 1;
                    var maxIn = 0;
                    for (; i < 3; i++)
                    {
                        if (overIn[i] > overIn[maxIn]) maxIn = i;
                    }

                    if(overIn[maxIn] > 0)
                    {
                        // the normal lies on the axis that overlapped last, the
                        // normal points away from A aka P1, pVelRelV3D is relative to P1
                        // (the bodies collide so pVelRelV3D points inwards A)
                        // therefore shows the invers direction of the normal
                        HitNormalV3D[maxIn] = pVelRelV3D[maxIn] > 0 ? -1 : 1;
                        var separationN = absP1p2V3D[maxIn] - (pP1.mScaledExtV3D[maxIn] + pP2.mScaledExtV3D[maxIn]);
                        c = new Physics.Collision(pP1, pP2, HitNormalV3D, maxIn, overIn[maxIn], separationN);
                    }
                    else
                    {
                        // the particle somehow overlapped already before the step

                        i = 1;
                        var maxDir = 0;
                        for (; i < 3; i++)
                        {
                            if (absP1p2V3D[i] > absP1p2V3D[maxDir]) maxDir = i;
                        }
                        var HitNormalV3D = [0,0,0];
                        HitNormalV3D[maxDir] = p1p2V3D[maxDir] > 0 ? 1 : -1;
                        var separationN = absP1p2V3D[maxDir] - (pP1.mScaledExtV3D[maxDir] + pP2.mScaledExtV3D[maxDir]);
                        c = new Physics.Collision(pP1, pP2, HitNormalV3D, maxDir, 0, separationN);
                    }
                }
               
                this.mCollisionsH.set(keyS, c);
                pP1.mCollisionsH.set(keyS, c);
                pP2.mCollisionsH.set(keyS, c);
                
                returnValB = true;
            }
        }
        else
        {
            // the particles do not collide
            if (c)
            {
                this.mCollisionsH.unset(keyS);
                pP1.mCollisionsH.unset(keyS);
                pP2.mCollisionsH.unset(keyS);
                if (pP1.mSleepsB && pP1.mNumN != -1) pP1.setAwake(true);
                if (pP2.mSleepsB && pP2.mNumN != -1) pP2.setAwake(true);
            }
            returnValB = false;
        }
        return returnValB;
    },
  
    collAABBsweep: function(pP1, pP2)
    {
        var mat = Math;
        var matv = V3DP;
        var returnValB = false;
        var timeIn = 0;
        var timeOut = -1;
        var overIn = [0,0,0];
        var overOut = [1,1,1];

        var pVelRelV3D = [pP2.mDisplaceV3D[0] - pP1.mDisplaceV3D[0],
                            pP2.mDisplaceV3D[1] - pP1.mDisplaceV3D[1],
                            pP2.mDisplaceV3D[2] - pP1.mDisplaceV3D[2]];
        var p1p2V3D = [pP2.mPosV3D[0] - pP1.mPosV3D[0],
                        pP2.mPosV3D[1] - pP1.mPosV3D[1],
                        pP2.mPosV3D[2] - pP1.mPosV3D[2],];
        var absP1p2V3D = [mat.abs(p1p2V3D[0]), mat.abs(p1p2V3D[1]), mat.abs(p1p2V3D[2])];

        var i = 0;
        var separated = false;
        for( ; i<3 ; i++)
        {
            if( pP1.mMaxOldV3D[i] < pP2.mMinOldV3D[i] && pVelRelV3D[i] < 0 )
            {
                overIn[i] = (pP1.mMaxOldV3D[i] - pP2.mMinOldV3D[i]) / pVelRelV3D[i];
            }
            else if( pP2.mMaxOldV3D[i] < pP1.mMinOldV3D[i] && pVelRelV3D[i] > 0 )
            {
                overIn[i] = (pP1.mMinOldV3D[i] - pP2.mMaxOldV3D[i]) / pVelRelV3D[i];
            }
            else if(absP1p2V3D[i] > pP1.mScaledExtV3D[i] + pP2.mScaledExtV3D[i])
            {
                // special case boxes are not moving towards each other on that axis and are not
                // already overlapping, so we found a saparating axis
                separated = true;
                break;
            }

            if( pP2.mMaxOldV3D[i] > pP1.mMinOldV3D[i] && pVelRelV3D[i] < 0 )
            {
                overOut[i] = (pP1.mMinOldV3D[i] - pP2.mMaxOldV3D[i]) / pVelRelV3D[i];
            }
            else if( pP1.mMaxOldV3D[i] > pP2.mMinOldV3D[i] && pVelRelV3D[i] > 0 )
            {
                overOut[i] = (pP1.mMaxOldV3D[i] - pP2.mMinOldV3D[i]) / pVelRelV3D[i];
            }
        }

        var maxIn = 0;
        var minOut = 0;
        if (!separated)
        {
            i = 1;    
            for (; i < 3; i++)
            {
                if (overIn[i] > overIn[maxIn])
                {
                    maxIn = i;
                }
                if (overOut[i] < overOut[minOut])
                {
                    minOut = i;
                }
            }
            timeIn = overIn[maxIn];
            timeOut = overOut[minOut];
        }
        

        var keyS = "";
        if (pP1.mNumN < pP2.mNumN)
        {
            keyS += pP1.mNumN;
            keyS += "_";
            keyS += pP2.mNumN;
        }
        else
        {
            keyS += pP2.mNumN;
            keyS += "_";
            keyS += pP1.mNumN;
        }
        var c = this.mCollisionsH._object[keyS];
        
        if (timeIn <= timeOut && !separated)
        {
            var separationN = -1;
            if (c)
            {
                if (timeIn == 0 && timeOut < 1)
                {
                    // collision existed in last step, false alarm, cause oldPos was in collision, but they
                    // are moving apart now
                    this.mCollisionsH.unset(keyS);
                    pP1.mCollisionsH.unset(keyS);
                    pP2.mCollisionsH.unset(keyS);
                    returnValB = false;
                }
                else
                {
                    // collision existed in last step, update
                    // perhaps normal recalc needed
                    
                    if(pP1.mScaledB || pP2.mScaledB)
                    {
                        // the particle was scaled in the last integration step
                        // to simulate the collision response caused by the expansion
                        // of the particle the HitNormal is p1p2V3D, the hittagents
                        // still lie in the hitting boxface
                        var HitNormalV3D = matv.copy(p1p2V3D);
                        matv.normalize(HitNormalV3D);
                        i = 1;
                        var maxDir = 0;
                        for (; i < 3; i++)
                        {
                            if (absP1p2V3D[i] > absP1p2V3D[maxDir]) maxDir = i;
                        }
                        var HitNormalFaceV3D = [0,0,0];
                        HitNormalFaceV3D[maxDir] = p1p2V3D[maxDir] > 0 ? 1 : -1;
                        var separationFaceNormalN = absP1p2V3D[maxDir] - (pP1.mScaledExtV3D[maxDir] + pP2.mScaledExtV3D[maxDir]);
                        var cosAlpha = matv.dot(HitNormalV3D, HitNormalFaceV3D);
                        var separationN = 0;
                        if (cosAlpha == 0) separationN = separationFaceNormalN;
                        else  separationN = separationFaceNormalN / cosAlpha;

                        c.mSeparationN = separationN;
                        c.mHitNormalV3D = HitNormalV3D;
                        c.mHitTangent1V3D = this.mHitTangentsA[maxDir][0];
                        c.mHitTangent2V3D = this.mHitTangentsA[maxDir][1];
                    }
                    else
                    {
                        c.mSeparationN = absP1p2V3D[c.mHitAxisN] - (pP1.mScaledExtV3D[c.mHitAxisN] + pP2.mScaledExtV3D[c.mHitAxisN]);

                    }
                    c.mHitTimeN = 0;

                    if (!this.mWarmStartB)
                    {
                        c.mPNormalN = 0;
                        c.mPNormalBN = 0;
                        c.mPTangent1N = 0;
                        c.mPTangent2N = 0;
                    }
                    returnValB = true;
                }
            }
            else 
            {
                // this is a new collision

                var HitNormalV3D = [0,0,0];

                if(pP1.mScaledB || pP2.mScaledB || timeIn == 0.0)
                {
                    // the particle was scaled in the last integration step
                    // to simulate the collision response caused by the expansion
                    // of the particle the HitNormal is p1p2V3D, the hittagents
                    // still lie in the boxface that was hit
                    // as this is a new collision there shouldnt be the case
                    // that timeIn is 0. still it happens after a scale and
                    // i handel it as such, even though P1 and P2 have mScaledB == 
                    HitNormalV3D = matv.copy(p1p2V3D);
                    matv.normalize(HitNormalV3D);
                    i = 1;
                    var maxDir = 0;
                    for (; i < 3; i++)
                    {
                        if (absP1p2V3D[i] > absP1p2V3D[maxDir]) maxDir = i;
                    }
                    var HitNormalFaceV3D = [0,0,0];
                    HitNormalFaceV3D[maxDir] = p1p2V3D[maxDir] > 0 ? 1 : -1;
                    var separationFaceNormalN = absP1p2V3D[maxDir] - (pP1.mScaledExtV3D[maxDir] + pP2.mScaledExtV3D[maxDir]);
                    var cosAlpha = matv.dot(HitNormalV3D, HitNormalFaceV3D);
                    var separationN = 0;
                    if (cosAlpha == 0) separationN = separationFaceNormalN;
                    else  separationN = separationFaceNormalN / cosAlpha;
                    c = new Physics.Collision(pP1, pP2, HitNormalV3D, maxDir, 0, separationN);
                }
                else
                {

                    // the axis that overlapped last is the normal direction
                    // normal Points away from A aka P1, pVelRelV3D is rel to P1
                    // therefore shows the invers direction of the normal
                    HitNormalV3D[maxIn] = pVelRelV3D[maxIn] > 0 ? -1 : 1;
                    separationN = absP1p2V3D[maxIn] - (pP1.mScaledExtV3D[maxIn] + pP2.mScaledExtV3D[maxIn]);

                    
                    c = new Physics.Collision(pP1, pP2, HitNormalV3D, maxIn, timeIn, separationN);
                }
                
                this.mCollisionsH.set(keyS, c);
                pP1.mCollisionsH.set(keyS, c);
                pP2.mCollisionsH.set(keyS, c);
                returnValB = true;
            }
            
        }
        else
        {
            if (c)
            {
                this.mCollisionsH.unset(keyS);
                pP1.mCollisionsH.unset(keyS);
                pP2.mCollisionsH.unset(keyS);
            }
            returnValB = false;;
        }
        return returnValB;
    }
});


