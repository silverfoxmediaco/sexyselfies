import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Use public folder for build compatibility
const logoImage = '/sexyselfies_logo.png';
const backgroundImage = '/placeholders/creatorblonde5.png';
import './OnboardingFlow.css';

const OnboardingFlow = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState('welcome');
  const [selectedRole, setSelectedRole] = useState(null);

  const memberTutorialSteps = [
    {
      id: 'member-1',
      title: 'Discover Amazing Creators',
      description: 'Swipe through profiles of verified creators who share content just for you. Find creators that match your preferences and interests.',
      image: '/images/tutorial-member-1.png',
      icon: '👀'
    },
    {
      id: 'member-2',
      title: 'Connect & Unlock Content',
      description: 'When you both like each other, you connect! This unlocks their exclusive content and opens up private messaging.',
      image: '/images/tutorial-member-2.png',
      icon: '💝'
    },
    {
      id: 'member-3',
      title: 'Pay Only For What You Want',
      description: 'No subscriptions! Pay small amounts ($0.99-$3.99) to unlock individual photos, videos, or special content you love.',
      image: '/images/tutorial-member-3.png',
      icon: '💰'
    }
  ];

  const creatorTutorialSteps = [
    {
      id: 'creator-1',
      title: 'Simple Registration',
      description: '',
      features: [
        'Email & secure password',
        'Choose your creator name',
        'Verify you\'re 18+',
        'Select your country'
      ],
      icon: '📷'
    },
    {
      id: 'creator-2',
      title: 'Industry-Leading Earnings',
      description: '',
      features: [
        'Keep 80% of all earnings',
        'Set prices from $0.99-$9.99',
        'Weekly payouts starting at $50',
        'No professional equipment needed'
      ],
      icon: '💰'
    },
    {
      id: 'creator-3',
      title: 'Powerful Creator Tools',
      description: '',
      features: [
        'Upload content instantly',
        'Real-time analytics dashboard',
        'Direct message your fans',
        'Track earnings & performance'
      ],
      icon: '📊'
    }
  ];

  const [currentTutorialStep, setCurrentTutorialStep] = useState(0);

  const handleRoleSelection = (role) => {
    setSelectedRole(role);
    setCurrentStep('tutorial');
    setCurrentTutorialStep(0);
  };

  const handleNextTutorial = () => {
    const steps = selectedRole === 'member' ? memberTutorialSteps : creatorTutorialSteps;
    if (currentTutorialStep < steps.length - 1) {
      setCurrentTutorialStep(currentTutorialStep + 1);
    } else {
      // Go directly to registration instead of signup screen
      if (selectedRole === 'creator') {
        navigate('/creator/register');
      } else {
        setCurrentStep('signup');
      }
    }
  };

  const handlePrevTutorial = () => {
    if (currentTutorialStep > 0) {
      setCurrentTutorialStep(currentTutorialStep - 1);
    } else {
      setCurrentStep('welcome');
    }
  };

  const handleSignup = () => {
    if (selectedRole === 'member') {
      navigate('/member/register');
    } else {
      navigate('/creator/register');
    }
  };

  const handleSkip = () => {
    setCurrentStep('signup');
  };

  if (currentStep === 'welcome') {
    return (
      <div className="OnboardingFlow-container">
        <div className="OnboardingFlow-background">
          <img
            src={backgroundImage}
            alt="SexySelfies Model"
            className="OnboardingFlow-backgroundImage"
            onError={(e) => {e.target.style.display = 'none'}}
          />
          <div className="OnboardingFlow-overlay" />
        </div>

        <div className="OnboardingFlow-content">
          <div className="OnboardingFlow-welcome">
            <div className="OnboardingFlow-header">
              <img
                src={logoImage}
                alt="Sexy Selfies"
                className="OnboardingFlow-logo"
                onError={(e) => {e.target.style.display = 'none'}}
              />
            </div>
            <p className="OnboardingFlow-subtitle">
              The platform where authentic creators and genuine fans connect it's free to join and always will be!
            </p>

            <div className="OnboardingFlow-roleButtons">
              <div className="OnboardingFlow-roleGroup">
                <button
                  className="OnboardingFlow-roleButton OnboardingFlow-memberButton"
                  onClick={() => handleRoleSelection('member')}
                >
                  <span className="OnboardingFlow-roleTitle">Become a Member</span>
                  {/* <span className="OnboardingFlow-roleDesc">Discover & connect with creators</span> */}
                </button>
              </div>

              <div className="OnboardingFlow-roleGroup">
                <button
                  className="OnboardingFlow-roleButton OnboardingFlow-creatorButton"
                  onClick={() => handleRoleSelection('creator')}
                >
                  <span className="OnboardingFlow-roleTitle">Become a Creator</span>
                  {/* <span className="OnboardingFlow-roleDesc">A Sanctuary of Self Expression</span> */}
                </button>
                
              </div>
            </div>

            <div className="OnboardingFlow-footer">
              <button
                  className="OnboardingFlow-loginLink"
                  onClick={() => navigate('/member/login')}
                >
                  Member Login
                </button>
                <button
                  className="OnboardingFlow-loginLink"
                  onClick={() => navigate('/creator/login')}
                >
                  Creator Login
                </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 'tutorial') {
    const steps = selectedRole === 'member' ? memberTutorialSteps : creatorTutorialSteps;
    const currentStepData = steps[currentTutorialStep];
    const isLastStep = currentTutorialStep === steps.length - 1;

    // Determine which background image to use
    const getBackgroundImage = () => {
      if (selectedRole === 'creator') {
        switch(currentTutorialStep) {
          case 0:
            return '/placeholders/creatorbrunette1.png';
          case 1:
            return '/placeholders/sexyblondeacceptibleimage.jpg';
          case 2:
            return '/placeholders/sexyjapanesegirl1.png';
          default:
            return '/placeholders/creatorbrunette1.png';
        }
      }
      return null;
    };

    return (
      <div className="OnboardingFlow-tutorialContainer">
        {selectedRole === 'creator' && (
          <>
            <div
              className="OnboardingFlow-tutorialBackground"
              style={{ backgroundImage: `url(${getBackgroundImage()})` }}
            />
            <div className="OnboardingFlow-tutorialOverlay" />
          </>
        )}

        <div className="OnboardingFlow-tutorialHeader">
          <div className="OnboardingFlow-progress">
            <span className="OnboardingFlow-progressText">
              {currentTutorialStep + 1} of {steps.length}
            </span>
            <div className="OnboardingFlow-progressBar">
              <div
                className="OnboardingFlow-progressFill"
                style={{ width: `${((currentTutorialStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>
          <button
            className="OnboardingFlow-skipButton"
            onClick={handleSkip}
          >
            Skip
          </button>
        </div>

        <div className="OnboardingFlow-tutorialContent">
          {selectedRole === 'member' && (
            <div className="OnboardingFlow-tutorialImage">
              <div className="OnboardingFlow-tutorialIcon">
                {currentStepData.icon}
              </div>
            </div>
          )}

          <div className="OnboardingFlow-tutorialText">
            <h2 className="OnboardingFlow-tutorialTitle">
              {currentStepData.title}
            </h2>
            {selectedRole === 'creator' && currentStepData.features ? (
              <ul className="OnboardingFlow-featuresList">
                {currentStepData.features.map((feature, index) => (
                  <li key={index} className="OnboardingFlow-featureItem">
                    • {feature}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="OnboardingFlow-tutorialDescription">
                {currentStepData.description}
              </p>
            )}
          </div>
        </div>

        <div className="OnboardingFlow-tutorialFooter">
          <button
            className="OnboardingFlow-backButtonBottom"
            onClick={handlePrevTutorial}
          >
            {currentTutorialStep > 0 ? 'Back' : 'Previous'}
          </button>
          <button
            className="OnboardingFlow-nextButton"
            onClick={handleNextTutorial}
          >
            {isLastStep ? 'Get Started' : 'Next'}
          </button>
        </div>
      </div>
    );
  }

  if (currentStep === 'signup') {
    return (
      <div className="OnboardingFlow-signupContainer">
        <div className="OnboardingFlow-signupContent">
          <div className="OnboardingFlow-signupIcon">
            🛡️
          </div>
          <h2 className="OnboardingFlow-signupTitle">
            {selectedRole === 'creator' ? 'Ready to Start Earning?' : 'Ready to get started?'}
          </h2>
          <p className="OnboardingFlow-signupDescription">
            {selectedRole === 'member'
              ? 'Create your member account to start discovering amazing creators.'
              : 'Join thousands of creators earning on their terms. No hidden fees, no equipment needed, just your phone and creativity.'
            }
          </p>

          {selectedRole === 'creator' && (
            <div className="OnboardingFlow-signupFeatures">
              <div className="OnboardingFlow-signupFeature">
                <span className="OnboardingFlow-checkmark">✓</span>
                <span>Age-verified platform</span>
              </div>
              <div className="OnboardingFlow-signupFeature">
                <span className="OnboardingFlow-checkmark">✓</span>
                <span>Secure payments</span>
              </div>
              <div className="OnboardingFlow-signupFeature">
                <span className="OnboardingFlow-checkmark">✓</span>
                <span>24/7 support</span>
              </div>
            </div>
          )}

          <div className="OnboardingFlow-signupButtons">
            <button
              className="OnboardingFlow-primaryButton"
              onClick={handleSignup}
            >
              Create {selectedRole === 'member' ? 'Member' : 'Creator'} Account
            </button>

            <button
              className="OnboardingFlow-secondaryButton"
              onClick={() => navigate(selectedRole === 'member' ? '/member/login' : '/creator/login')}
            >
              {selectedRole === 'creator' ? 'Sign up later' : 'I already have an account'}
            </button>
          </div>

          <button
            className="OnboardingFlow-backToStart"
            onClick={() => {
              setCurrentStep('welcome');
              setSelectedRole(null);
              setCurrentTutorialStep(0);
            }}
          >
            ← Back to start
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default OnboardingFlow;