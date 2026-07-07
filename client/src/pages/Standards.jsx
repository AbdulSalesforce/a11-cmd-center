export default function Standards() {
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
                        <span className="slds-page-header__title slds-truncate" title="Salesforce A11Y Standards">
                          Salesforce A11Y Standards
                        </span>
                      </h1>
                    </div>
                  </div>
                  <p className="slds-page-header__name-meta">WCAG 2.2 Level A & AA Compliance Guidelines</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="slds-card">
          <div className="slds-card__body slds-card__body_inner slds-p-around_large">
            <h2 className="slds-text-heading_medium slds-m-bottom_medium">Overview</h2>
            <p className="slds-text-body_regular slds-m-bottom_large">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </p>

            <h3 className="slds-text-heading_small slds-m-bottom_small">Guidelines</h3>
            <p className="slds-text-body_regular slds-m-bottom_medium">
              Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
            </p>

            <ul className="slds-list_dotted slds-m-bottom_large">
              <li>Lorem ipsum dolor sit amet, consectetur adipiscing elit</li>
              <li>Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua</li>
              <li>Ut enim ad minim veniam, quis nostrud exercitation ullamco</li>
              <li>Duis aute irure dolor in reprehenderit in voluptate</li>
              <li>Excepteur sint occaecat cupidatat non proident</li>
            </ul>

            <h3 className="slds-text-heading_small slds-m-bottom_small">Best Practices</h3>
            <p className="slds-text-body_regular slds-m-bottom_medium">
              Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
            </p>

            <p className="slds-text-body_regular">
              Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
