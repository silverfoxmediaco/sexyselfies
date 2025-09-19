import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Use public folder for build compatibility
const logoImage = '/sexyselfies_logo.png';
const backgroundImage = '/onboardingscreen1.png';
import '../styles/OnboardingFlow.css';

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
      title: 'Upload Your Content',
      description: 'Share your photos and videos with our "Instagram Plus" standards. Sexy but tasteful content that showcases your personality.',
      image: '/images/tutorial-creator-1.png',
      icon: '📸'
    },
    {
      id: 'creator-2',
      title: 'Connect With Members',
      description: 'Members swipe and connect with you. Browse high-value members and send them personalized messages and special offers.',
      image: '/images/tutorial-creator-2.png',
      icon: '💋'
    },
    {
      id: 'creator-3',
      title: 'Earn 80% Revenue Share',
      description: 'Keep 80% of everything you earn! Get paid weekly for content unlocks, tips, and special offers. The highest payout in the industry.',
      image: '/images/tutorial-creator-3.png',
      icon: '💸'
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
      setCurrentStep('signup');
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
          <div className="OnboardingFlow-header">
            <img
              src={logoImage}
              alt="SexySelfies"
              className="OnboardingFlow-logo"
              onError={(e) => {e.target.style.display = 'none'}}
            />
          </div>

          <div className="OnboardingFlow-welcome">
            <h1 className="OnboardingFlow-title">
              Welcome to SexySelfies
            </h1>
            <p className="OnboardingFlow-subtitle">
              The platform where authentic creators and genuine fans connect
            </p>

            <div className="OnboardingFlow-roleButtons">
              <button
                className="OnboardingFlow-roleButton OnboardingFlow-memberButton"
                onClick={() => handleRoleSelection('member')}
              >
                <span className="OnboardingFlow-roleIcon">👤</span>
                <span className="OnboardingFlow-roleTitle">I'm a Member</span>
                <span className="OnboardingFlow-roleDesc">Discover & connect with creators</span>
              </button>

              <button
                className="OnboardingFlow-roleButton OnboardingFlow-creatorButton"
                onClick={() => handleRoleSelection('creator')}
              >
                <span className="OnboardingFlow-roleIcon">⭐</span>
                <span className="OnboardingFlow-roleTitle">I'm a Creator</span>
                <span className="OnboardingFlow-roleDesc">Share content & earn money</span>
              </button>
            </div>

            <div className="OnboardingFlow-footer">
              <button
                className="OnboardingFlow-skipButton"
                onClick={() => navigate('/')}
              >
                Browse without signing up
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

    return (
      <div className="OnboardingFlow-tutorialContainer">
        <div className="OnboardingFlow-tutorialHeader">
          <button
            className="OnboardingFlow-backButton"
            onClick={handlePrevTutorial}
          >
            ←
          </button>
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
          <div className="OnboardingFlow-tutorialImage">
            <div className="OnboardingFlow-tutorialIcon">
              {currentStepData.icon}
            </div>
          </div>

          <div className="OnboardingFlow-tutorialText">
            <h2 className="OnboardingFlow-tutorialTitle">
              {currentStepData.title}
            </h2>
            <p className="OnboardingFlow-tutorialDescription">
              {currentStepData.description}
            </p>
          </div>
        </div>

        <div className="OnboardingFlow-tutorialFooter">
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
          <h2 className="OnboardingFlow-signupTitle">
            Ready to get started?
          </h2>
          <p className="OnboardingFlow-signupDescription">
            {selectedRole === 'member'
              ? 'Create your member account to start discovering amazing creators.'
              : 'Create your creator account to start earning money from your content.'
            }
          </p>

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
              I already have an account
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