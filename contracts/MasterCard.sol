// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IMasterCard.sol";
contract MasterCard is IMasterCard, ERC721Enumerable, Ownable {
    string  public baseUri = "";
    uint256 public lastedId;
    uint256 public constant _duration = 30 days;

    struct ExpiredDay {
        uint256 initialDate;
        uint256 dueDate;
    }
    
    mapping(uint256 => ExpiredDay) public expiredTime;

    constructor (string memory _name, string memory _symbol) ERC721(_name, _symbol) {}

    function _baseURI() internal view override returns (string memory) {
        return baseUri;
    }

    function setBaseURI(string memory _uri) external onlyOwner {
       baseUri = _uri;
    }

    function extend(address _account) public {
        require(balanceOf(_account) > 0, "You not have a ticket !");
        uint256 tokenId = tokenOfOwnerByIndex(_account, 0);
        require(expiredTime[tokenId].dueDate < block.timestamp, "This ticket is not expired !");
        expiredTime[tokenId].initialDate = block.timestamp;
        expiredTime[tokenId].dueDate = expiredTime[tokenId].initialDate + _duration;
    }

    function mint(address _to) public {
        require(balanceOf(_to) == 0, "You have a ticket !");
        _mint(_to, ++lastedId);
        expiredTime[lastedId].initialDate = block.timestamp;
        expiredTime[lastedId].dueDate = expiredTime[lastedId].initialDate + _duration;
    }

    function getDueDate(uint256 tokenId) external override view returns (uint256) {
        return expiredTime[tokenId].dueDate;
    }
}