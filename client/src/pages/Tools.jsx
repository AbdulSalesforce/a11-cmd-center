export default function Tools() {
  return (
    <div className="slds-scope">
      <div className="slds-container_large slds-container_center slds-p-around_large">
        {/* Page Header */}
        <div className="slds-page-header slds-m-bottom_large">
          <div className="slds-page-header__row">
            <div className="slds-page-header__col-title">
              <div className="slds-media">
                <div className="slds-media__body">
                  <div className="slds-page-header__name">
                    <div className="slds-page-header__name-title">
                      <h1>
                        <span className="slds-page-header__title slds-truncate" title="Accessibility Tools">
                          Accessibility Tools
                        </span>
                      </h1>
                    </div>
                  </div>
                  <p className="slds-page-header__name-meta">Resources and utilities for accessibility testing</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tool Cards */}
        <div className="slds-grid slds-wrap slds-gutters slds-m-bottom_large">
          <div className="slds-col slds-size_1-of-1 slds-medium-size_1-of-2">
            <article className="slds-card">
              <div className="slds-card__header slds-grid">
                <header className="slds-media slds-media_center slds-has-flexi-truncate">
                  <div className="slds-media__body">
                    <h2 className="slds-card__header-title">
                      <span className="slds-truncate">Tool Name 1</span>
                    </h2>
                  </div>
                </header>
              </div>
              <div className="slds-card__body slds-card__body_inner">
                <p className="slds-text-body_regular">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                </p>
              </div>
            </article>
          </div>

          <div className="slds-col slds-size_1-of-1 slds-medium-size_1-of-2">
            <article className="slds-card">
              <div className="slds-card__header slds-grid">
                <header className="slds-media slds-media_center slds-has-flexi-truncate">
                  <div className="slds-media__body">
                    <h2 className="slds-card__header-title">
                      <span className="slds-truncate">Tool Name 2</span>
                    </h2>
                  </div>
                </header>
              </div>
              <div className="slds-card__body slds-card__body_inner">
                <p className="slds-text-body_regular">
                  Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
                </p>
              </div>
            </article>
          </div>

          <div className="slds-col slds-size_1-of-1 slds-medium-size_1-of-2">
            <article className="slds-card">
              <div className="slds-card__header slds-grid">
                <header className="slds-media slds-media_center slds-has-flexi-truncate">
                  <div className="slds-media__body">
                    <h2 className="slds-card__header-title">
                      <span className="slds-truncate">Tool Name 3</span>
                    </h2>
                  </div>
                </header>
              </div>
              <div className="slds-card__body slds-card__body_inner">
                <p className="slds-text-body_regular">
                  Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                </p>
              </div>
            </article>
          </div>

          <div className="slds-col slds-size_1-of-1 slds-medium-size_1-of-2">
            <article className="slds-card">
              <div className="slds-card__header slds-grid">
                <header className="slds-media slds-media_center slds-has-flexi-truncate">
                  <div className="slds-media__body">
                    <h2 className="slds-card__header-title">
                      <span className="slds-truncate">Tool Name 4</span>
                    </h2>
                  </div>
                </header>
              </div>
              <div className="slds-card__body slds-card__body_inner">
                <p className="slds-text-body_regular">
                  Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.
                </p>
              </div>
            </article>
          </div>
        </div>

        {/* Additional Info */}
        <div className="slds-card">
          <div className="slds-card__body slds-card__body_inner slds-p-around_large">
            <h2 className="slds-text-heading_medium slds-m-bottom_medium">More Information</h2>
            <p className="slds-text-body_regular slds-m-bottom_medium">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </p>
            <p className="slds-text-body_regular">
              Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
