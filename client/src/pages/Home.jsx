export default function Home() {
  return (
    <div className="slds-scope">
      <div className="slds-container_large slds-container_center slds-p-around_large">
        {/* Hero Section */}
        <div className="slds-text-align_center slds-m-bottom_xx-large">
          <h1 className="slds-text-heading_large slds-m-bottom_medium">
            Welcome to the A11y Command Center
          </h1>
          <p className="slds-text-body_regular slds-text-color_weak" style={{ fontSize: '1.125rem', maxWidth: '800px', margin: '0 auto' }}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="slds-grid slds-wrap slds-gutters">
          <div className="slds-col slds-size_1-of-1 slds-medium-size_1-of-3">
            <article className="slds-card">
              <div className="slds-card__body slds-card__body_inner">
                <div className="slds-media">
                  <div className="slds-media__figure">
                    <span className="slds-icon_container slds-icon-standard-dashboard" style={{ backgroundColor: '#0176d3' }}>
                      <svg className="slds-icon slds-icon_small" aria-hidden="true">
                        <use xlinkHref="/assets/icons/standard-sprite/svg/symbols.svg#dashboard"></use>
                      </svg>
                    </span>
                  </div>
                  <div className="slds-media__body">
                    <h2 className="slds-text-heading_small slds-m-bottom_x-small">Audits</h2>
                    <p className="slds-text-body_small">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore.
                    </p>
                  </div>
                </div>
              </div>
            </article>
          </div>

          <div className="slds-col slds-size_1-of-1 slds-medium-size_1-of-3">
            <article className="slds-card">
              <div className="slds-card__body slds-card__body_inner">
                <div className="slds-media">
                  <div className="slds-media__figure">
                    <span className="slds-icon_container slds-icon-standard-document" style={{ backgroundColor: '#04844b' }}>
                      <svg className="slds-icon slds-icon_small" aria-hidden="true">
                        <use xlinkHref="/assets/icons/standard-sprite/svg/symbols.svg#document"></use>
                      </svg>
                    </span>
                  </div>
                  <div className="slds-media__body">
                    <h2 className="slds-text-heading_small slds-m-bottom_x-small">Standards</h2>
                    <p className="slds-text-body_small">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia.
                    </p>
                  </div>
                </div>
              </div>
            </article>
          </div>

          <div className="slds-col slds-size_1-of-1 slds-medium-size_1-of-3">
            <article className="slds-card">
              <div className="slds-card__body slds-card__body_inner">
                <div className="slds-media">
                  <div className="slds-media__figure">
                    <span className="slds-icon_container slds-icon-standard-apps" style={{ backgroundColor: '#fe9339' }}>
                      <svg className="slds-icon slds-icon_small" aria-hidden="true">
                        <use xlinkHref="/assets/icons/standard-sprite/svg/symbols.svg#apps"></use>
                      </svg>
                    </span>
                  </div>
                  <div className="slds-media__body">
                    <h2 className="slds-text-heading_small slds-m-bottom_x-small">Tools</h2>
                    <p className="slds-text-body_small">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                    </p>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>

        {/* Additional Content */}
        <div className="slds-m-top_xx-large">
          <div className="slds-card">
            <div className="slds-card__body slds-card__body_inner slds-p-around_large">
              <h2 className="slds-text-heading_medium slds-m-bottom_medium">About This Platform</h2>
              <p className="slds-text-body_regular slds-m-bottom_medium">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
              </p>
              <p className="slds-text-body_regular">
                Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
